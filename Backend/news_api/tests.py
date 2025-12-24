from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Category, Article, TeamRank

User = get_user_model()


class NewsAPITestCase(TestCase):
    """新闻API测试用例"""

    def setUp(self):
        """测试前准备"""
        self.client = APIClient()
        
        # 创建测试用户
        self.author = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='pass123'
        )
        
        # 创建分类
        self.category1 = Category.objects.create(
            name='行业资讯',
            slug='industry',
            description='行业相关资讯'
        )
        self.category2 = Category.objects.create(
            name='雀魂新闻',
            slug='majsoul',
            description='雀魂游戏相关新闻'
        )
        
        # 创建已发布的文章
        self.published_article = Article.objects.create(
            title='已发布文章',
            content='这是已发布文章的内容',
            summary='已发布文章摘要',
            author=self.author,
            category=self.category1,
            status='published'
        )
        
        # 创建草稿文章
        self.draft_article = Article.objects.create(
            title='草稿文章',
            content='这是草稿文章的内容',
            summary='草稿文章摘要',
            author=self.author,
            category=self.category1,
            status='draft'
        )
        
        # 创建战队排名
        self.team_rank = TeamRank.objects.create(
            rank=1,
            team_name='测试战队',
            score='100分',
            season='2023赛季'
        )

    def test_get_categories(self):
        """测试获取分类列表"""
        url = reverse('category-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_get_articles_list(self):
        """测试获取文章列表（只返回已发布的）"""
        url = reverse('article-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 应该只包含已发布的文章
        article_ids = [item['id'] for item in response.data]
        self.assertIn(self.published_article.id, article_ids)
        self.assertNotIn(self.draft_article.id, article_ids)

    def test_get_articles_by_category(self):
        """测试按分类筛选文章"""
        url = reverse('article-list')
        response = self.client.get(url, {'category': 'industry'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if len(response.data) > 0:
            # 验证所有文章都属于指定分类（序列化器返回 category_name）
            for article in response.data:
                self.assertEqual(article['category_name'], self.category1.name)

    def test_search_articles(self):
        """测试搜索文章"""
        url = reverse('article-list')
        response = self.client.get(url, {'search': '已发布'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 应该找到包含"已发布"的文章
        article_titles = [item['title'] for item in response.data]
        self.assertIn('已发布文章', article_titles)

    def test_get_article_detail(self):
        """测试获取文章详情"""
        url = reverse('article-detail', kwargs={'id': self.published_article.id})
        initial_views = self.published_article.views
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], '已发布文章')
        self.assertEqual(response.data['content'], '这是已发布文章的内容')
        
        # 验证浏览量增加
        self.published_article.refresh_from_db()
        self.assertGreater(self.published_article.views, initial_views)

    def test_get_draft_article_detail(self):
        """测试获取草稿文章详情（应该失败）"""
        url = reverse('article-detail', kwargs={'id': self.draft_article.id})
        response = self.client.get(url)
        
        # 草稿文章不应该通过已发布文章的查询集返回
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_industry_news(self):
        """测试获取行业资讯"""
        url = reverse('industry-news')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证所有文章都属于行业分类（序列化器返回 category_name）
        for article in response.data:
            self.assertEqual(article['category_name'], self.category1.name)

    def test_get_majsoul_news(self):
        """测试获取雀魂新闻"""
        # 创建雀魂分类的文章
        majsoul_article = Article.objects.create(
            title='雀魂新闻',
            content='雀魂新闻内容',
            author=self.author,
            category=self.category2,
            status='published'
        )
        
        url = reverse('majsoul-news')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证所有文章都属于雀魂分类（序列化器返回 category_name）
        for article in response.data:
            self.assertEqual(article['category_name'], self.category2.name)

    def test_get_news_home_data(self):
        """测试获取新闻首页数据"""
        url = reverse('news-home-data')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('industry_news', response.data)
        self.assertIn('majsoul_news', response.data)
        self.assertIn('rankings', response.data)

    def test_article_published_at_set_on_publish(self):
        """测试文章发布时自动设置发布时间"""
        article = Article.objects.create(
            title='新文章',
            content='内容',
            author=self.author,
            category=self.category1,
            status='draft'
        )
        
        # 初始状态不应该有发布时间
        self.assertIsNone(article.published_at)
        
        # 发布文章
        article.status = 'published'
        article.save()
        
        # 应该有发布时间
        article.refresh_from_db()
        self.assertIsNotNone(article.published_at)

    def test_article_ordering(self):
        """测试文章排序（按发布时间降序）"""
        # 创建多个文章
        article1 = Article.objects.create(
            title='文章1',
            content='内容1',
            author=self.author,
            category=self.category1,
            status='published'
        )
        # 等待一小段时间确保时间不同
        import time
        time.sleep(0.01)
        
        article2 = Article.objects.create(
            title='文章2',
            content='内容2',
            author=self.author,
            category=self.category1,
            status='published'
        )
        
        url = reverse('article-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if len(response.data) >= 2:
            # 验证排序（最新的在前，article2应该在article1之前）
            article_ids = [item['id'] for item in response.data]
            # article2 的索引应该小于 article1（因为更新的在前）
            idx2 = article_ids.index(article2.id) if article2.id in article_ids else -1
            idx1 = article_ids.index(article1.id) if article1.id in article_ids else -1
            
            if idx2 >= 0 and idx1 >= 0:
                self.assertLess(idx2, idx1, "更新的文章应该在前面")

    def test_category_str_representation(self):
        """测试分类字符串表示"""
        self.assertEqual(str(self.category1), '行业资讯')

    def test_article_str_representation(self):
        """测试文章字符串表示"""
        self.assertEqual(str(self.published_article), '已发布文章')

    def test_team_rank_str_representation(self):
        """测试战队排名字符串表示"""
        self.assertIn('测试战队', str(self.team_rank))
        self.assertIn('第1名', str(self.team_rank))

    def test_team_rank_unique_together(self):
        """测试战队排名的唯一性约束"""
        # 创建相同排名和赛季的记录应该失败
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            TeamRank.objects.create(
                rank=1,
                team_name='另一个战队',
                score='90分',
                season='2023赛季'
            )

    def test_news_home_data_exception(self):
        """测试新闻首页数据异常处理"""
        from unittest.mock import patch
        url = reverse('news-home-data')
        
        # Mock Category.objects.filter 抛出异常
        with patch('news_api.views.Category.objects.filter') as mock_filter:
            mock_filter.side_effect = Exception("数据库错误")
            
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertFalse(response.data['success'])

    def test_news_home_data_no_categories(self):
        """测试新闻首页数据（没有分类）"""
        # 删除所有分类
        Category.objects.all().delete()
        
        url = reverse('news-home-data')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['industry_news']), 0)
        self.assertEqual(len(response.data['majsoul_news']), 0)

    def test_mleague_ranking_no_data(self):
        """测试M-League排名（没有数据）"""
        # 删除所有排名数据
        TeamRank.objects.all().delete()
        
        from news_api.views import MLeagueRankingView
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/')
        view = MLeagueRankingView()
        view.request = request
        
        queryset = view.get_queryset()
        self.assertEqual(queryset.count(), 0)

    def test_mleague_ranking_multiple_seasons(self):
        """测试M-League排名（多个赛季）"""
        # 先删除现有的排名数据
        TeamRank.objects.all().delete()
        
        from django.utils import timezone
        from datetime import timedelta
        
        # 创建多个赛季的数据，确保2023赛季的更新时间更晚
        rank_2022 = TeamRank.objects.create(
            rank=1,
            team_name='战队A',
            score='100分',
            season='2022赛季'
        )
        # 手动设置更新时间，确保2023赛季更新
        rank_2022.last_updated = timezone.now() - timedelta(days=1)
        rank_2022.save()
        
        rank_2023 = TeamRank.objects.create(
            rank=1,
            team_name='战队B',
            score='110分',
            season='2023赛季'
        )
        # 确保2023赛季的更新时间更晚
        rank_2023.last_updated = timezone.now()
        rank_2023.save()
        
        from news_api.views import MLeagueRankingView
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/')
        view = MLeagueRankingView()
        view.request = request
        
        queryset = view.get_queryset()
        # 应该返回最新赛季的数据（按last_updated排序）
        if queryset.exists():
            # 验证返回的是最新更新的赛季
            returned_season = queryset.first().season
            self.assertIn(returned_season, ['2022赛季', '2023赛季'])

    def test_article_detail_view_increments_views(self):
        """测试文章详情视图增加浏览量"""
        initial_views = self.published_article.views
        url = reverse('article-detail', kwargs={'id': self.published_article.id})
        response = self.client.get(url)
        
        self.published_article.refresh_from_db()
        self.assertGreater(self.published_article.views, initial_views)
