"""
Django管理命令：将现有比赛的match_id迁移为统一格式
统一格式：{date}-{teamA}-{teamB}-{teamC}-{teamD}
使用方法: python manage.py migrate_match_id_format
"""
from django.core.management.base import BaseCommand
from mleague.models import Match
from datetime import datetime


class Command(BaseCommand):
    help = '将现有比赛的match_id迁移为统一格式: {date}-{teamA}-{teamB}-{teamC}-{teamD}'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='仅显示将要更改的内容，不实际执行',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='跳过确认提示，直接执行迁移',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        confirm = options.get('confirm', False)
        
        # 获取所有比赛
        matches = Match.objects.all()
        total_count = matches.count()
        
        self.stdout.write(self.style.WARNING('=' * 60))
        self.stdout.write(self.style.WARNING(f'准备迁移 {total_count} 场比赛的match_id格式'))
        if dry_run:
            self.stdout.write(self.style.WARNING('（仅显示预览，不实际修改）'))
        self.stdout.write(self.style.WARNING('=' * 60))
        
        # 统计需要更新的记录
        need_update = []
        already_correct = []
        no_teams = []
        
        for match in matches:
            # 检查是否已有正确的格式（date-teamA-teamB-...）
            expected_id_parts = match.match_id.split('-') if match.match_id else []
            
            # 验证当前match_id是否符合统一格式
            # 统一格式应该是: YYYY-MM-DD-team1-team2-team3-team4
            is_correct_format = False
            if match.match_id and len(expected_id_parts) >= 4:
                try:
                    # 检查前3部分是否为日期格式
                    date_str = '-'.join(expected_id_parts[:3])
                    datetime.strptime(date_str, '%Y-%m-%d')
                    # 检查后面是否有队伍名称
                    if len(expected_id_parts) > 3:
                        is_correct_format = True
                except (ValueError, IndexError):
                    pass
            
            # 生成正确的match_id
            if not match.teams or len(match.teams) == 0:
                no_teams.append(match)
                continue
            
            team_names = sorted([t.get('name', '').strip() for t in match.teams])
            if not team_names or not any(team_names):
                no_teams.append(match)
                continue
            
            date_str = match.date.strftime('%Y-%m-%d') if match.date else ''
            if not date_str:
                no_teams.append(match)
                continue
            
            correct_match_id = f"{date_str}-{'-'.join(team_names)}"
            
            if match.match_id == correct_match_id:
                already_correct.append(match)
            else:
                need_update.append({
                    'match': match,
                    'old_id': match.match_id,
                    'new_id': correct_match_id
                })
        
        # 显示统计信息
        self.stdout.write(f'\n统计信息:')
        self.stdout.write(f'  总比赛数: {total_count}')
        self.stdout.write(self.style.SUCCESS(f'  格式已正确: {len(already_correct)}'))
        self.stdout.write(self.style.WARNING(f'  需要更新: {len(need_update)}'))
        if no_teams:
            self.stdout.write(self.style.ERROR(f'  无法生成ID（无有效队伍）: {len(no_teams)}'))
        
        if no_teams:
            self.stdout.write(f'\n无法处理的比赛（无有效队伍信息）:')
            for match in no_teams[:10]:  # 只显示前10个
                self.stdout.write(f'  - ID: {match.id}, Date: {match.date}, Match ID: {match.match_id}')
            if len(no_teams) > 10:
                self.stdout.write(f'  ... 还有 {len(no_teams) - 10} 个')
        
        # 显示需要更新的示例
        if need_update:
            self.stdout.write(f'\n需要更新的比赛示例（前5个）:')
            for item in need_update[:5]:
                self.stdout.write(f'  旧ID: {item["old_id"]}')
                self.stdout.write(f'  新ID: {item["new_id"]}')
                self.stdout.write('  ---')
            if len(need_update) > 5:
                self.stdout.write(f'  ... 还有 {len(need_update) - 5} 个')
        
        if not need_update:
            self.stdout.write(self.style.SUCCESS('\n所有比赛的match_id格式都已正确，无需更新！'))
            return
        
        # 确认操作
        if not dry_run and not confirm:
            confirm_input = input(f'\n确定要更新 {len(need_update)} 场比赛的match_id吗？(yes/no): ')
            if confirm_input.lower() not in ['yes', 'y']:
                self.stdout.write(self.style.ERROR('操作已取消'))
                return
        
        # 执行更新
        if not dry_run:
            updated_count = 0
            error_count = 0
            
            for item in need_update:
                try:
                    match = item['match']
                    # 检查新ID是否已存在（可能与其他记录冲突）
                    existing = Match.objects.filter(match_id=item['new_id']).exclude(id=match.id).first()
                    if existing:
                        self.stdout.write(
                            self.style.WARNING(
                                f'警告: 新ID "{item["new_id"]}" 已存在（记录ID: {existing.id}），跳过更新记录ID: {match.id}'
                            )
                        )
                        error_count += 1
                        continue
                    
                    match.match_id = item['new_id']
                    match.save()
                    updated_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'更新记录ID {item["match"].id} 失败: {str(e)}')
                    )
                    error_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'\n迁移完成！'))
            self.stdout.write(self.style.SUCCESS(f'  成功更新: {updated_count} 条'))
            if error_count > 0:
                self.stdout.write(self.style.ERROR(f'  失败: {error_count} 条'))
        else:
            self.stdout.write(self.style.SUCCESS('\n这是预览模式，未实际修改数据。'))
