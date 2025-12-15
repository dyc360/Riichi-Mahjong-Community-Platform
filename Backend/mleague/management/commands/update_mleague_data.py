"""
Django管理命令：手动更新M-League最新数据
使用方法: python manage.py update_mleague_data
"""
from django.core.management.base import BaseCommand
from mleague.tasks import update_rankings_from_scraper, update_schedule_from_scraper


class Command(BaseCommand):
    help = '更新M-League最新数据（排名、赛程等）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='rankings',
            choices=['rankings', 'schedule', 'all'],
            help='要更新的数据类型',
        )

    def handle(self, *args, **options):
        update_type = options['type']

        if update_type in ['rankings', 'all']:
            self.stdout.write('开始更新最新排名数据...')
            success = update_rankings_from_scraper()
            if success:
                self.stdout.write(self.style.SUCCESS('排名数据更新成功！'))
            else:
                self.stdout.write(self.style.ERROR('排名数据更新失败，请查看日志。'))

        if update_type in ['schedule', 'all']:
            self.stdout.write('开始更新赛程数据...')
            schedule_data = update_schedule_from_scraper()
            if schedule_data:
                self.stdout.write(self.style.SUCCESS(f'赛程数据更新成功！共 {len(schedule_data)} 条记录。'))
            else:
                self.stdout.write(self.style.ERROR('赛程数据更新失败，请查看日志。'))

