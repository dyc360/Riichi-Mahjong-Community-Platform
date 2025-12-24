# news_api/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from .models import Article, Category, TeamRank
from .serializers import *


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Article.objects.filter(status='published')

        # 按分类筛选
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # 搜索功能
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(summary__icontains=search)
            )

        return queryset.order_by('-published_at', '-created_at')


class IndustryNewsView(generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Article.objects.filter(
            status='published',
            category__slug='industry'
        ).order_by('-published_at')[:10]


class MLeagueRankingView(generics.ListAPIView):
    serializer_class = TeamRankSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # 获取最新赛季的数据（按last_updated排序，取最新的赛季）
        # 首先获取所有有数据的赛季
        seasons = TeamRank.objects.values_list('season', flat=True).distinct()
        if not seasons:
            return TeamRank.objects.none()
        
        # 找到最新更新的赛季
        latest_season = None
        latest_time = None
        for season in seasons:
            latest_rank = TeamRank.objects.filter(season=season).order_by('-last_updated').first()
            if latest_rank and (not latest_time or latest_rank.last_updated > latest_time):
                latest_time = latest_rank.last_updated
                latest_season = season
        
        if latest_season:
            return TeamRank.objects.filter(season=latest_season).order_by('rank')
        return TeamRank.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # 获取最后更新时间
        last_updated = None
        if queryset.exists():
            last_updated = queryset.latest('last_updated').last_updated

        return Response({
            'success': True,
            'data': serializer.data,
            'last_updated': last_updated
        })


class MajsoulNewsView(generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Article.objects.filter(
            status='published',
            category__slug='majsoul'
        ).order_by('-published_at')[:10]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def news_home_data(request):
    """获取新闻首页数据（三个模块的数据）"""
    try:
        # 获取行业资讯分类
        industry_category = Category.objects.filter(slug='industry').first()
        majsoul_category = Category.objects.filter(slug='majsoul').first()

        industry_news = Article.objects.filter(
            status='published',
            category=industry_category
        ).order_by('-published_at')[:6] if industry_category else []

        majsoul_news = Article.objects.filter(
            status='published',
            category=majsoul_category
        ).order_by('-published_at')[:4] if majsoul_category else []

        # 获取最新赛季的排名数据
        seasons = TeamRank.objects.values_list('season', flat=True).distinct()
        latest_season = None
        latest_time = None
        for season in seasons:
            latest_rank = TeamRank.objects.filter(season=season).order_by('-last_updated').first()
            if latest_rank and (not latest_time or latest_rank.last_updated > latest_time):
                latest_time = latest_rank.last_updated
                latest_season = season
        
        rankings = TeamRank.objects.filter(season=latest_season).order_by('rank') if latest_season else TeamRank.objects.none()

        return Response({
            'success': True,
            'industry_news': ArticleListSerializer(industry_news, many=True).data,
            'majsoul_news': ArticleListSerializer(majsoul_news, many=True).data,
            'rankings': TeamRankSerializer(rankings, many=True).data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# news_api/views.py - 在现有代码基础上添加

class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1  # 增加阅读量
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# 按分类获取文章列表
class ArticleListByCategoryView(generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        return Article.objects.filter(
            status='published',
            category__slug=category_slug
        ).order_by('-published_at')


# 雀魂新闻爬取
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # 临时允许任何访问，生产环境应限制
def scrape_majsoul_news(request):
    """
    从雀魂官网爬取最新新闻并保存到数据库
    """
    from .scraper import MajSoulNewsScraper
    from django.contrib.auth import get_user_model
    from django.utils import timezone

    User = get_user_model()

    try:
        # 获取或创建雀魂分类
        category, created = Category.objects.get_or_create(
            slug='majsoul',
            defaults={
                'name': '雀魂动态',
                'description': '雀魂游戏更新、活动与赛事信息'
            }
        )

        # 获取默认用户（这里使用第一个用户，生产环境应指定特定用户）
        try:
            default_user = User.objects.first()
            if not default_user:
                return Response({'error': '没有找到用户'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': '没有找到用户'}, status=status.HTTP_400_BAD_REQUEST)

        # 初始化爬取器
        scraper = MajSoulNewsScraper()
        news_items = scraper.fetch_latest_news(limit=10)

        created_count = 0
        updated_count = 0

        for news_item in news_items:
            print(f"处理新闻: {news_item}")  # 调试信息
            # 检查是否已存在（基于标题）
            existing_article = Article.objects.filter(
                title=news_item['title'],
                category=category
            ).first()

            if existing_article:
                # 更新现有文章
                existing_article.content = news_item.get('description', '')
                existing_article.summary = news_item.get('description', '')[:300]
                existing_article.published_at = news_item.get('published_at') or timezone.now()
                existing_article.updated_at = timezone.now()
                existing_article.save()
                updated_count += 1
            else:
                # 创建新文章
                Article.objects.create(
                    title=news_item['title'],
                    content=news_item.get('description', ''),
                    summary=news_item.get('description', '')[:300],
                    author=default_user,
                    category=category,
                    status='published',
                    published_at=news_item.get('published_at') or timezone.now(),
                )
                created_count += 1

        return Response({
            'message': '雀魂新闻爬取完成',
            'created': created_count,
            'updated': updated_count,
            'total_processed': len(news_items)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'爬取失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)