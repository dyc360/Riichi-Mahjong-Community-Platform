"""
Django管理命令：手动更新雀魂新闻数据
使用方法: python manage.py update_majsoul_news
"""
from django.core.management.base import BaseCommand
from news_api.tasks import update_majsoul_news_from_scraper


class Command(BaseCommand):
    help = '更新雀魂最新新闻数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=20,
            help='要抓取的新闻数量限制',
        )

    def handle(self, *args, **options):
        limit = options['limit']

        self.stdout.write(f'开始更新雀魂新闻数据 (限制: {limit}条)...')

        success = update_majsoul_news_from_scraper()

        if success:
            self.stdout.write(self.style.SUCCESS('雀魂新闻数据更新成功！'))
        else:
            self.stdout.write(self.style.ERROR('雀魂新闻数据更新失败，请查看日志。'))