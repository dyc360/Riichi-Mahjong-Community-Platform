"""
Django管理命令：手动更新M-League最新数据
使用方法: python manage.py update_mleague_data
"""
from django.core.management.base import BaseCommand
from mleague.tasks import (
    update_rankings_from_scraper, 
    update_schedule_from_scraper,
    update_player_stats_from_scraper,
    update_points_data_from_scraper,
    update_all_mleague_data,
    update_current_season_schedule
)
from datetime import datetime


class Command(BaseCommand):
    help = '更新M-League最新数据（排名、赛程、选手统计、积分等）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='all',
            choices=['rankings', 'schedule', 'player-stats', 'points', 'all'],
            help='要更新的数据类型',
        )
        parser.add_argument(
            '--year',
            type=int,
            help='赛程数据的年份（仅用于schedule类型）',
        )
        parser.add_argument(
            '--month',
            type=int,
            help='赛程数据的月份（仅用于schedule类型）',
        )
        parser.add_argument(
            '--no-historical',
            action='store_true',
            help='不抓取历史赛季的赛程数据（仅用于all类型）',
        )

    def handle(self, *args, **options):
        update_type = options['type']
        year = options.get('year')
        month = options.get('month')

        if update_type == 'all':
            self.stdout.write('开始更新所有M-League数据...')
            include_historical = not options.get('no_historical', False)
            results = update_all_mleague_data(include_historical_schedule=include_historical)
            self.stdout.write(self.style.SUCCESS(f'数据更新完成！结果: {results}'))
            return

        if update_type == 'rankings':
            self.stdout.write('开始更新最新排名数据...')
            success = update_rankings_from_scraper()
            if success:
                self.stdout.write(self.style.SUCCESS('排名数据更新成功！'))
            else:
                self.stdout.write(self.style.ERROR('排名数据更新失败，请查看日志。'))

        if update_type == 'schedule':
            self.stdout.write('开始更新赛程数据...')
            # 如果没有指定年份和月份，更新整个当前赛季
            if not year and not month:
                self.stdout.write('未指定年份和月份，将更新整个当前赛季的数据...')
                success = update_current_season_schedule()
                if success:
                    self.stdout.write(self.style.SUCCESS('当前赛季赛程数据更新成功！'))
                else:
                    self.stdout.write(self.style.ERROR('当前赛季赛程数据更新失败，请查看日志。'))
            else:
                # 如果指定了年份和月份，更新指定月份的数据
                if not year or not month:
                    now = datetime.now()
                    year = year or now.year
                    month = month or now.month
                    self.stdout.write(f'使用当前日期: {year}年{month}月')
                
                schedule_data = update_schedule_from_scraper(year=year, month=month)
                if schedule_data:
                    self.stdout.write(self.style.SUCCESS(f'赛程数据更新成功！共 {len(schedule_data)} 条记录。'))
                else:
                    self.stdout.write(self.style.ERROR('赛程数据更新失败，请查看日志。'))

        if update_type == 'player-stats':
            self.stdout.write('开始更新选手统计数据...')
            success = update_player_stats_from_scraper()
            if success:
                self.stdout.write(self.style.SUCCESS('选手统计数据更新成功！'))
            else:
                self.stdout.write(self.style.ERROR('选手统计数据更新失败，请查看日志。'))

        if update_type == 'points':
            self.stdout.write('开始更新积分数据...')
            success = update_points_data_from_scraper()
            if success:
                self.stdout.write(self.style.SUCCESS('积分数据更新成功！'))
            else:
                self.stdout.write(self.style.ERROR('积分数据更新失败，请查看日志。'))

