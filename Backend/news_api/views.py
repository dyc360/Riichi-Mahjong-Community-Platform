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


class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleDetailSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


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
        season = self.request.query_params.get('season', '2023赛季')
        return TeamRank.objects.filter(season=season).order_by('rank')

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

        rankings = TeamRank.objects.filter(season='2023赛季').order_by('rank')

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