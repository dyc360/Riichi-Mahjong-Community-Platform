# news_api/management/commands/seed_news_data.py
from django.core.management.base import BaseCommand
from news_api.models import Category, TeamRank, Article
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = '初始化新闻数据'

    def handle(self, *args, **options):
        # 创建分类
        categories_data = [
            {'name': '行业资讯', 'slug': 'industry', 'description': '立直麻将相关的最新行业动态与赛事信息'},
            {'name': 'M-League', 'slug': 'm-league', 'description': 'M-League联赛相关新闻与积分榜'},
            {'name': '雀魂动态', 'slug': 'majsoul', 'description': '雀魂游戏更新、活动与赛事信息'},
            {'name': '雀魂游戏新闻', 'slug': 'majsoul-news', 'description': '雀魂游戏的最新新闻和更新'},
        ]

        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'创建分类: {category.name}')

        # 创建M-League排名数据
        teams_data = [
            {'rank': 1, 'team_name': '風林火山', 'score': '+602.5'},
            {'rank': 2, 'team_name': '麻雀格闘倶楽部', 'score': '+495.8'},
            {'rank': 3, 'team_name': 'BEAST', 'score': '+54.1'},
            {'rank': 4, 'team_name': 'ドリブンズ', 'score': '+8.2'},
            {'rank': 5, 'team_name': 'Pirates', 'score': '-92.6'},
            {'rank': 6, 'team_name': 'ROYAL', 'score': '-156.3'},
            {'rank': 7, 'team_name': 'e-MA', 'score': '-210.7'},
            {'rank': 8, 'team_name': 'AGAINST', 'score': '-701.0'},
        ]

        for team_data in teams_data:
            team, created = TeamRank.objects.get_or_create(
                rank=team_data['rank'],
                season='2023赛季',
                defaults=team_data
            )
            if created:
                self.stdout.write(f'创建战队排名: {team.team_name}')

        self.stdout.write(self.style.SUCCESS('成功初始化新闻数据'))