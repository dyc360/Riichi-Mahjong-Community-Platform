"""
定时任务：定期抓取M-League数据并保存到数据库
可以使用Celery或Django的定时任务
"""
import logging
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from .scraper import MLeagueOfficialScraper
from .models import TeamRanking, Match, TeamPlayerStats, PointsData

logger = logging.getLogger(__name__)


def update_rankings_from_scraper():
    """
    从官网抓取器更新最新排名数据并保存到数据库
    """
    try:
        # 创建抓取器
        scraper = MLeagueOfficialScraper()
        
        # 抓取最新数据
        rankings_data = scraper.fetch_rankings()
        
        if not rankings_data:
            logger.warning("未获取到排名数据")
            return False
        
        # 从数据中获取实际赛季
        season = rankings_data[0].get('season', '最新赛季')
        
        # 更新数据库
        updated_count = 0
        for data in rankings_data:
            team_ranking, created = TeamRanking.objects.update_or_create(
                rank=data['rank'],
                season=season,
                defaults={
                    'team_name': data['team_name'],
                    'score': data.get('score', '0'),
                }
            )
            if created:
                logger.info(f"创建新排名记录: {team_ranking.team_name}")
            else:
                logger.info(f"更新排名记录: {team_ranking.team_name}")
            updated_count += 1
        
        logger.info(f"成功更新 {updated_count} 条排名数据（赛季: {season}）")
        return True
        
    except Exception as e:
        logger.error(f"更新排名数据失败: {str(e)}", exc_info=True)
        return False


def update_schedule_from_scraper(year: int = None, month: int = None):
    """
    从网络抓取器更新赛程数据并保存到数据库
    
    Args:
        year: 年份，如果为None则使用当前年份
        month: 月份，如果为None且year是历史年份，则抓取整个赛季的数据
    """
    try:
        scraper = MLeagueOfficialScraper()
        schedule_data = scraper.fetch_schedule(year=year, month=month)
        
        if not schedule_data:
            logger.warning(f"未获取到赛程数据 (year={year}, month={month})")
            return []
        
        # 保存到数据库
        saved_count = 0
        updated_count = 0
        for data in schedule_data:
            # 解析日期
            date_str = data.get('date')
            if not date_str:
                continue
            
            # 过滤掉teams为空的比赛
            teams = data.get('teams', [])
            if not teams or len(teams) == 0:
                logger.debug(f"跳过teams为空的比赛: {date_str}")
                continue
            
            # 过滤掉所有队伍名称都为空的情况
            valid_teams = [t for t in teams if t.get('name', '').strip()]
            if not valid_teams:
                logger.debug(f"跳过多队名称为空的比赛: {date_str}")
                continue
            
            try:
                match_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                logger.warning(f"无效的日期格式: {date_str}")
                continue
            
            # 统一使用 {date}-{teamA}-{teamB}-{teamC}-{teamD} 格式的match_id
            # 确保队伍名称格式一致：去除前后空格，统一处理
            team_names = sorted([t.get('name', '').strip() for t in valid_teams])
            
            # 始终生成标准的match_id（即使scraper已经生成，也重新生成以确保格式一致）
            match_id = f"{date_str}-{'-'.join(team_names)}"
            
            # 使用match_id进行更新或创建
            # 如果match_id已存在，直接更新；如果不存在，先检查是否有相同date和队伍的旧记录（match_id为None）
            match = None
            
            try:
                # 首先尝试用match_id查找
                match = Match.objects.get(match_id=match_id)
            except Match.DoesNotExist:
                match = None
            except Match.MultipleObjectsReturned:
                # 如果存在多条相同match_id的记录（理论上不应该发生），取第一条并删除其他的
                matches = Match.objects.filter(match_id=match_id)
                match = matches.first()
                logger.warning(f"发现多条相同match_id的记录: {match_id}，保留第一条，删除其他 {matches.count() - 1} 条")
                for dup_match in matches[1:]:
                    dup_match.delete()
            
            if not match:
                # 如果match_id不存在，检查是否有相同date和队伍的旧记录（match_id为None）
                # 这种情况可能发生在数据迁移或旧数据中
                existing_matches = Match.objects.filter(
                    date=match_date,
                    match_id__isnull=True
                )
                
                # 检查是否有队伍匹配的记录
                for existing_match in existing_matches:
                    existing_teams = existing_match.teams or []
                    existing_team_names = sorted([t.get('name', '').strip() for t in existing_teams])
                    
                    # 比较队伍名称是否一致
                    if existing_team_names == team_names:
                        match = existing_match
                        logger.debug(f"找到匹配的旧记录（match_id为None），将更新: {match_date}")
                        break
                
                # 如果找到匹配的旧记录，删除其他重复的记录（如果有）
                if match:
                    # 查找所有其他匹配的重复记录（除了当前找到的这条）
                    duplicate_matches = Match.objects.filter(
                        date=match_date,
                        match_id__isnull=True
                    ).exclude(id=match.id)
                    
                    # 检查并删除其他重复记录
                    for dup_match in duplicate_matches:
                        dup_teams = dup_match.teams or []
                        dup_team_names = sorted([t.get('name', '').strip() for t in dup_teams])
                        if dup_team_names == team_names:
                            logger.warning(f"发现重复记录，删除: ID={dup_match.id}, Date={match_date}")
                            dup_match.delete()
            
            if match:
                # 更新现有记录
                match.match_id = match_id  # 确保match_id被设置
                match.date = match_date
                match.day = data.get('day')
                match.month = data.get('month')
                match.year = data.get('year')
                match.day_week = data.get('day_week', '')
                match.status = data.get('status', 'upcoming')
                match.teams = valid_teams
                match.result = data.get('result')
                match.save()
                updated_count += 1
                logger.debug(f"更新比赛记录: {match_date} - {match_id}")
            else:
                # 创建新记录
                match = Match.objects.create(
                    match_id=match_id,
                    date=match_date,
                    day=data.get('day'),
                    month=data.get('month'),
                    year=data.get('year'),
                    day_week=data.get('day_week', ''),
                    status=data.get('status', 'upcoming'),
                    teams=valid_teams,
                    result=data.get('result'),
                )
                saved_count += 1
                logger.debug(f"创建新比赛记录: {match_date} - {match_id}")
        
        logger.info(f"成功保存赛程数据: 新建 {saved_count} 条, 更新 {updated_count} 条 (year={year}, month={month})")
        return schedule_data
        
    except Exception as e:
        logger.error(f"更新赛程数据失败: {str(e)}", exc_info=True)
        return []


def update_player_stats_from_scraper():
    """
    从官网抓取器更新选手统计数据并保存到数据库
    """
    try:
        scraper = MLeagueOfficialScraper()
        stats_data = scraper.fetch_player_stats()
        
        if not stats_data:
            logger.warning("未获取到选手统计数据")
            return False
        
        # 从数据中获取实际赛季（从第一条数据中获取）
        season = stats_data[0].get('season', '最新赛季') if stats_data else '最新赛季'
        
        # 更新数据库
        updated_count = 0
        for data in stats_data:
            team_name = data.get('team_name')
            if not team_name:
                continue
            
            team_stats, created = TeamPlayerStats.objects.update_or_create(
                team_name=team_name,
                season=season,
                defaults={
                    'team_id': data.get('team_id', ''),
                    'players': data.get('players', []),
                }
            )
            
            if created:
                logger.info(f"创建新队伍统计记录: {team_name}")
            else:
                logger.info(f"更新队伍统计记录: {team_name}")
            updated_count += 1
        
        logger.info(f"成功更新 {updated_count} 条队伍选手统计数据（赛季: {season}）")
        return True
        
    except Exception as e:
        logger.error(f"更新选手统计数据失败: {str(e)}", exc_info=True)
        return False


def update_points_data_from_scraper():
    """
    从官网抓取器更新积分数据并保存到数据库
    """
    try:
        from .scraper import fetch_points_data
        
        points_response = fetch_points_data()
        
        if not points_response:
            logger.warning("积分数据抓取返回None")
            return False
        
        if not points_response.get('success'):
            error_msg = points_response.get('message', '未知错误')
            logger.warning(f"未获取到积分数据: {error_msg}")
            # 检查是否是Selenium未安装的问题
            if 'Selenium' in error_msg or 'selenium' in error_msg.lower():
                logger.warning("提示: 积分数据需要Selenium来抓取动态内容，请安装selenium: pip install selenium")
            return False
        
        points_data_dict = points_response.get('data', {})
        
        if not points_data_dict:
            logger.warning("积分数据字典为空")
            return False
        
        # 保存每种类型的积分数据
        saved_count = 0
        for points_type, team_data in points_data_dict.items():
            if not team_data:
                logger.debug(f"积分类型 {points_type} 没有数据，跳过")
                continue
            
            points_data, created = PointsData.objects.update_or_create(
                points_type=points_type,
                defaults={
                    'team_data': team_data,
                }
            )
            
            if created:
                logger.info(f"创建新积分数据记录: {points_type} ({len(team_data)} 条队伍数据)")
            else:
                logger.info(f"更新积分数据记录: {points_type} ({len(team_data)} 条队伍数据)")
            saved_count += 1
        
        logger.info(f"成功更新 {saved_count} 种类型的积分数据")
        return True
        
    except ImportError as e:
        logger.error(f"导入失败（可能是Selenium未安装）: {str(e)}")
        logger.warning("提示: 积分数据需要Selenium来抓取动态内容，请安装selenium: pip install selenium")
        return False
    except Exception as e:
        logger.error(f"更新积分数据失败: {str(e)}", exc_info=True)
        return False


def update_current_season_schedule():
    """
    更新当前赛季的所有赛程数据（9-12月 + 次年1-5月）
    """
    from datetime import datetime
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # 计算当前赛季的开始年份
    # M-League赛季：9-12月属于开始年份，1-5月属于结束年份
    if current_month >= 9:
        # 当前是9-12月，赛季开始年份是当前年份
        season_start_year = current_year
    else:
        # 当前是1-5月，赛季开始年份是上一年
        season_start_year = current_year - 1
    
    season_end_year = season_start_year + 1
    logger.info(f"开始更新当前赛季（{season_start_year}-{season_end_year}）的所有赛程数据...")
    
    total_count = 0
    
    # 抓取开始年份的9-12月数据
    for month in range(9, 13):
        try:
            schedule_data = update_schedule_from_scraper(year=season_start_year, month=month)
            if schedule_data:
                total_count += len(schedule_data)
                logger.info(f"成功更新 {season_start_year} 年{month}月赛程数据: {len(schedule_data)} 条记录")
        except Exception as e:
            logger.warning(f"更新 {season_start_year} 年{month}月赛程数据失败: {str(e)}")
    
    # 抓取结束年份的1-5月数据
    for month in range(1, 6):
        try:
            schedule_data = update_schedule_from_scraper(year=season_end_year, month=month)
            if schedule_data:
                total_count += len(schedule_data)
                logger.info(f"成功更新 {season_end_year} 年{month}月赛程数据: {len(schedule_data)} 条记录")
        except Exception as e:
            logger.warning(f"更新 {season_end_year} 年{month}月赛程数据失败: {str(e)}")
    
    logger.info(f"当前赛季（{season_start_year}-{season_end_year}）共更新 {total_count} 条赛程数据")
    return total_count > 0


def update_all_mleague_data(include_historical_schedule=True):
    """
    更新所有M-League数据
    
    Args:
        include_historical_schedule: 是否包含历史赛季的赛程数据（默认True）
    """
    results = {
        'rankings': False,
        'schedule': False,
        'schedule_historical': False,
        'player_stats': False,
        'points': False,
    }
    
    logger.info("开始更新所有M-League数据...")
    
    # 更新排名
    results['rankings'] = update_rankings_from_scraper()
    
    # 更新当前赛季赛程数据（整个赛季：9-12月 + 次年1-5月）
    results['schedule'] = update_current_season_schedule()
    
    # 更新历史赛季赛程数据（如果需要）
    if include_historical_schedule:
        logger.info("开始更新历史赛季赛程数据...")
        historical_years = [2024, 2023, 2022, 2021, 2020, 2019, 2018]  # M-League从2018年开始
        historical_success = False
        for year in historical_years:
            try:
                schedule_data = update_schedule_from_scraper(year=year, month=None)
                if schedule_data:
                    historical_success = True
                    logger.info(f"成功更新 {year} 年赛季赛程数据: {len(schedule_data)} 条记录")
            except Exception as e:
                logger.warning(f"更新 {year} 年赛季赛程数据失败: {str(e)}")
        results['schedule_historical'] = historical_success
    
    # 更新选手统计
    results['player_stats'] = update_player_stats_from_scraper()
    
    # 更新积分数据
    results['points'] = update_points_data_from_scraper()
    
    logger.info(f"M-League数据更新完成: {results}")
    return results


# 如果使用Celery，可以这样定义任务
try:
    from celery import shared_task
    
    @shared_task
    def celery_update_rankings():
        """Celery任务：更新最新排名数据"""
        return update_rankings_from_scraper()
    
    @shared_task
    def celery_update_schedule():
        """Celery任务：更新赛程（当前月份）"""
        from datetime import datetime
        now = datetime.now()
        return update_schedule_from_scraper(year=now.year, month=now.month)
    
    @shared_task
    def celery_update_current_season_schedule():
        """Celery任务：更新当前赛季的所有赛程数据"""
        return update_current_season_schedule()
    
    @shared_task
    def celery_update_player_stats():
        """Celery任务：更新选手统计"""
        return update_player_stats_from_scraper()
    
    @shared_task
    def celery_update_points():
        """Celery任务：更新积分数据"""
        return update_points_data_from_scraper()
    
    @shared_task
    def celery_update_all():
        """Celery任务：更新所有数据（包括历史赛季）"""
        return update_all_mleague_data(include_historical_schedule=True)
    
    @shared_task
    def celery_update_all_current():
        """Celery任务：更新所有当前数据（不包括历史赛季）"""
        return update_all_mleague_data(include_historical_schedule=False)
        
except ImportError:
    # 如果没有安装Celery，使用Django的定时任务
    pass

