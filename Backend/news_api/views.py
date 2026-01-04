# news_api/views.py
import logging
from datetime import datetime
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from django.utils import timezone
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
    """雀魂新闻视图 - 返回预设的新闻数据"""
    from .serializers import MajSoulNewsSerializer
    serializer_class = MajSoulNewsSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """返回空查询集，因为我们直接从爬虫获取数据"""
        from .models import MajSoulNews
        return MajSoulNews.objects.none()

    def list(self, request, *args, **kwargs):
        """返回预设的新闻数据，不进行爬取"""
        logger = logging.getLogger(__name__)
        
        # 获取分页参数
        limit = request.query_params.get('limit', None)
        if limit:
            try:
                limit = int(limit)
            except ValueError:
                limit = 20  # 默认值
        else:
            limit = 20  # 默认值
        
        # 预设的新闻数据
        default_news = [
            {
                'id': 1,
                'title': '雀魂新版本更新公告',
                'description': '全新版本带来多项改进，包括新的游戏模式和优化体验。新增了多个游戏功能，优化了游戏性能，修复了已知问题。',
                'link': 'https://mahjongsoul.yo-star.com/news/update-2024',
                'image_url': 'https://placehold.co/400x200/6366f1/ffffff?text=Update',
                'published_at': timezone.now().isoformat(),
                'category': '更新',
                'source': '雀魂官网',
                'last_updated': timezone.now().isoformat(),
            },
            {
                'id': 2,
                'title': '新年锦标赛即将开启',
                'description': '2026年新年锦标赛报名通道已开放，欢迎所有玩家参与。本次锦标赛设置了丰厚的奖励，包括限定称号和特殊道具。',
                'link': 'https://mahjongsoul.yo-star.com/news/tournament-2024',
                'image_url': 'https://placehold.co/400x200/ec4899/ffffff?text=Tournament',
                'published_at': timezone.now().isoformat(),
                'category': '活动',
                'source': '雀魂官网',
                'last_updated': timezone.now().isoformat(),
            },
            {
                'id': 3,
                'title': '新角色「望月凛」登场',
                'description': '来自北海道的天才少女角色正式加入雀魂大家庭。望月凛是一位充满活力的角色，拥有独特的语音和立绘。',
                'link': 'https://mahjongsoul.yo-star.com/news/character-mochizuki',
                'image_url': 'https://placehold.co/400x200/f59e0b/ffffff?text=Character',
                'published_at': timezone.now().isoformat(),
                'category': '角色',
                'source': '雀魂官网',
                'last_updated': timezone.now().isoformat(),
            },
            {
                'id': 4,
                'title': '游戏平衡性调整说明',
                'description': '根据玩家反馈和数据分析，我们对部分游戏机制进行了平衡性调整，以提供更好的游戏体验。',
                'link': 'https://mahjongsoul.yo-star.com/news/balance-2024',
                'image_url': 'https://placehold.co/400x200/10b981/ffffff?text=Balance',
                'published_at': timezone.now().isoformat(),
                'category': '更新',
                'source': '雀魂官网',
                'last_updated': timezone.now().isoformat(),
            },
            {
                'id': 5,
                'title': '限时活动：双倍经验周',
                'description': '本周开启双倍经验活动，所有对局获得的经验值翻倍，是提升等级的好时机！',
                'link': 'https://mahjongsoul.yo-star.com/news/double-exp',
                'image_url': 'https://placehold.co/400x200/8b5cf6/ffffff?text=Event',
                'published_at': timezone.now().isoformat(),
                'category': '活动',
                'source': '雀魂官网',
                'last_updated': timezone.now().isoformat(),
            }
        ]
        
        # 应用分页
        formatted_news = default_news[:limit]
        
        # 支持搜索
        search = request.query_params.get('search', None)
        if search:
            search_lower = search.lower()
            formatted_news = [
                news for news in formatted_news
                if search_lower in news.get('title', '').lower() or 
                   search_lower in news.get('description', '').lower()
            ]
        
        # 支持分类筛选
        category = request.query_params.get('category', None)
        if category:
            formatted_news = [
                news for news in formatted_news
                if news.get('category', '').lower() == category.lower()
            ]
        
        logger.info(f"返回预设新闻数据，共 {len(formatted_news)} 条")
        return Response(formatted_news)


class MajsoulNewsDetailView(generics.RetrieveAPIView):
    """雀魂新闻详情视图"""
    from .serializers import MajSoulNewsSerializer
    from .models import MajSoulNews
    queryset = MajSoulNews.objects.filter(is_active=True)
    serializer_class = MajSoulNewsSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'


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