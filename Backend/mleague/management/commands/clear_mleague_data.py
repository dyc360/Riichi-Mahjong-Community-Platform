"""
Django管理命令：清空M-League数据库中的数据
使用方法: python manage.py clear_mleague_data [--type TYPE]
"""
from django.core.management.base import BaseCommand
from mleague.models import TeamRanking, Match, TeamPlayerStats, PointsData


class Command(BaseCommand):
    help = '清空M-League数据库中的数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='all',
            choices=['rankings', 'schedule', 'player-stats', 'points', 'all'],
            help='要清空的数据类型',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='跳过确认提示，直接清空数据',
        )

    def handle(self, *args, **options):
        clear_type = options['type']
        confirm = options.get('confirm', False)
        
        # 统计要删除的数据
        stats = {}
        if clear_type in ['rankings', 'all']:
            stats['rankings'] = TeamRanking.objects.count()
        if clear_type in ['schedule', 'all']:
            stats['schedule'] = Match.objects.count()
        if clear_type in ['player-stats', 'all']:
            stats['player-stats'] = TeamPlayerStats.objects.count()
        if clear_type in ['points', 'all']:
            stats['points'] = PointsData.objects.count()
        
        # 显示统计信息
        self.stdout.write(self.style.WARNING('=' * 60))
        self.stdout.write(self.style.WARNING('准备清空以下数据:'))
        for key, count in stats.items():
            type_name = {
                'rankings': '排名数据',
                'schedule': '赛程数据',
                'player-stats': '选手统计数据',
                'points': '积分数据'
            }.get(key, key)
            self.stdout.write(self.style.WARNING(f'  - {type_name}: {count} 条记录'))
        self.stdout.write(self.style.WARNING('=' * 60))
        
        # 确认操作
        if not confirm:
            confirm_input = input('确定要清空这些数据吗？(yes/no): ')
            if confirm_input.lower() not in ['yes', 'y']:
                self.stdout.write(self.style.ERROR('操作已取消'))
                return
        
        # 执行清空操作
        deleted_counts = {}
        
        if clear_type in ['rankings', 'all']:
            count, _ = TeamRanking.objects.all().delete()
            deleted_counts['rankings'] = count
            self.stdout.write(self.style.SUCCESS(f'[OK] 已清空排名数据: {count} 条记录'))
        
        if clear_type in ['schedule', 'all']:
            count, _ = Match.objects.all().delete()
            deleted_counts['schedule'] = count
            self.stdout.write(self.style.SUCCESS(f'[OK] 已清空赛程数据: {count} 条记录'))
        
        if clear_type in ['player-stats', 'all']:
            count, _ = TeamPlayerStats.objects.all().delete()
            deleted_counts['player-stats'] = count
            self.stdout.write(self.style.SUCCESS(f'[OK] 已清空选手统计数据: {count} 条记录'))
        
        if clear_type in ['points', 'all']:
            count, _ = PointsData.objects.all().delete()
            deleted_counts['points'] = count
            self.stdout.write(self.style.SUCCESS(f'[OK] 已清空积分数据: {count} 条记录'))
        
        self.stdout.write(self.style.SUCCESS('\n数据清空完成！'))