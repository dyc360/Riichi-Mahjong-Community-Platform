"""
Django管理命令：检查M-League数据库中的数据情况
使用方法: python manage.py check_mleague_data
"""
from django.core.management.base import BaseCommand
from mleague.models import TeamRanking, Match, TeamPlayerStats, PointsData
from django.db.models import Count, Q
from datetime import datetime


class Command(BaseCommand):
    help = '检查M-League数据库中的数据情况'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('M-League 数据库数据检查报告'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # 1. 检查排名数据
        self.stdout.write('\n【排名数据】')
        rankings = TeamRanking.objects.all()
        rankings_by_season = rankings.values('season').annotate(count=Count('id')).order_by('-season')
        self.stdout.write(f'总记录数: {rankings.count()}')
        for item in rankings_by_season:
            self.stdout.write(f'  - {item["season"]}: {item["count"]} 条记录')
        
        # 2. 检查赛程数据
        self.stdout.write('\n【赛程数据】')
        matches = Match.objects.all()
        total_matches = matches.count()
        self.stdout.write(f'总比赛数: {total_matches}')
        
        # 按年份统计
        matches_by_year = matches.values('year').annotate(count=Count('id')).order_by('year')
        self.stdout.write('\n按年份统计:')
        for item in matches_by_year:
            year = item['year']
            count = item['count']
            # 统计该年份各月份的数据
            months = matches.filter(year=year).values('month').distinct().order_by('month')
            month_list = ', '.join([f'{m["month"]}月' for m in months])
            self.stdout.write(f'  - {year}年: {count} 场比赛 ({month_list})')
        
        # 按赛季统计（跨年赛季）
        self.stdout.write('\n按赛季统计（跨年）:')
        current_year = datetime.now().year
        for start_year in range(2018, current_year + 1):
            # 赛季：start_year年9-12月 + (start_year+1)年1-5月
            season_matches = matches.filter(
                Q(year=start_year, month__gte=9, month__lte=12) |
                Q(year=start_year+1, month__gte=1, month__lte=5)
            )
            season_count = season_matches.count()
            if season_count > 0:
                # 统计该赛季各月份的数据
                months_data = season_matches.values('year', 'month').distinct().order_by('year', 'month')
                month_list = []
                for m in months_data:
                    month_list.append(f'{m["year"]}年{m["month"]}月')
                month_str = ', '.join(month_list)
                self.stdout.write(f'  - {start_year}-{start_year+1}赛季: {season_count} 场比赛')
                self.stdout.write(f'    包含月份: {month_str}')
        
        # 按状态统计
        matches_by_status = matches.values('status').annotate(count=Count('id'))
        self.stdout.write('\n按状态统计:')
        for item in matches_by_status:
            status_name = '已完成' if item['status'] == 'finished' else '即将开始'
            self.stdout.write(f'  - {status_name}: {item["count"]} 场比赛')
        
        # 3. 检查选手统计数据
        self.stdout.write('\n【选手统计数据】')
        player_stats = TeamPlayerStats.objects.all()
        stats_by_season = player_stats.values('season').annotate(count=Count('id')).order_by('-season')
        self.stdout.write(f'总记录数: {player_stats.count()}')
        for item in stats_by_season:
            self.stdout.write(f'  - {item["season"]}: {item["count"]} 支队伍')
        
        # 4. 检查积分数据
        self.stdout.write('\n【积分数据】')
        points_data = PointsData.objects.all()
        self.stdout.write(f'总记录数: {points_data.count()}')
        for item in points_data:
            team_count = len(item.team_data) if item.team_data else 0
            self.stdout.write(f'  - {item.get_points_type_display()}: {team_count} 支队伍数据')
            self.stdout.write(f'    最后更新: {item.last_updated.strftime("%Y-%m-%d %H:%M:%S")}')
        
        # 5. 数据完整性检查
        self.stdout.write('\n【数据完整性检查】')
        issues = []
        
        # 检查是否有历史赛季数据缺失
        expected_seasons = list(range(2018, current_year + 1))
        for start_year in expected_seasons:
            season_matches = matches.filter(
                Q(year=start_year, month__gte=9, month__lte=12) |
                Q(year=start_year+1, month__gte=1, month__lte=5)
            )
            if season_matches.count() == 0:
                issues.append(f'[WARN] {start_year}-{start_year+1}赛季: 没有数据')
        
        if issues:
            self.stdout.write(self.style.WARNING('发现以下问题:'))
            for issue in issues:
                self.stdout.write(self.style.WARNING(f'  {issue}'))
        else:
            self.stdout.write(self.style.SUCCESS('[OK] 所有历史赛季都有数据'))
        
        # 检查是否有月份数据缺失（对于有数据的赛季）
        self.stdout.write('\n【月份数据完整性检查】')
        for start_year in range(2018, current_year + 1):
            season_matches = matches.filter(
                Q(year=start_year, month__gte=9, month__lte=12) |
                Q(year=start_year+1, month__gte=1, month__lte=5)
            )
            if season_matches.count() > 0:
                # 检查该赛季是否包含所有月份
                expected_months = []
                # 开始年份的9-12月
                for month in range(9, 13):
                    expected_months.append((start_year, month))
                # 结束年份的1-5月
                for month in range(1, 6):
                    expected_months.append((start_year+1, month))
                
                missing_months = []
                for year, month in expected_months:
                    if not season_matches.filter(year=year, month=month).exists():
                        missing_months.append(f'{year}年{month}月')
                
                if missing_months:
                    self.stdout.write(self.style.WARNING(f'  {start_year}-{start_year+1}赛季缺少月份: {", ".join(missing_months)}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'  [OK] {start_year}-{start_year+1}赛季: 所有月份都有数据'))
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('检查完成！'))
