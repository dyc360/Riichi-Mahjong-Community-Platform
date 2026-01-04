"""
定时任务：定期抓取M-League数据
可以使用Celery或Django的定时任务
"""
import logging
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from .scraper import MLeagueOfficialScraper, fetch_points_data
from .models import Match, TeamRanking, TeamPlayerStats, PointsData

logger = logging.getLogger(__name__)


def update_rankings_from_scraper():
    """
    从官网抓取器更新最新排名数据
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
            
            try:
                match_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                logger.warning(f"无效的日期格式: {date_str}")
                continue
            
            # 使用match_id作为唯一标识，如果没有则使用日期+队伍名
            match_id = data.get('match_id')
            if not match_id:
                # 生成一个基于日期和队伍的ID，格式与scraper保持一致
                # 使用排序后的所有队伍名称确保稳定性
                team_names = sorted([t.get('name', '').strip() for t in data.get('teams', []) if t.get('name', '').strip()])
                match_id = f"{date_str}-{'-'.join(team_names)}"
            
            match, created = Match.objects.update_or_create(
                match_id=match_id,
                defaults={
                    'date': match_date,
                    'day': data.get('day'),
                    'month': data.get('month'),
                    'year': data.get('year'),
                    'day_week': data.get('day_week', ''),
                    'status': data.get('status', 'upcoming'),
                    'teams': data.get('teams', []),
                    'result': data.get('result'),
                }
            )
            
            if created:
                saved_count += 1
                logger.debug(f"创建新比赛记录: {match_date} - {match_id}")
            else:
                updated_count += 1
                logger.debug(f"更新比赛记录: {match_date} - {match_id}")
        
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
        
        # 保存到数据库
        saved_count = 0
        updated_count = 0
        for data in stats_data:
            season = data.get('season', '最新赛季')
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
                saved_count += 1
                logger.info(f"创建新选手统计记录: {team_name} ({season})")
            else:
                updated_count += 1
                logger.info(f"更新选手统计记录: {team_name} ({season})")
        
        logger.info(f"成功保存选手统计数据: 新建 {saved_count} 条, 更新 {updated_count} 条")
        return True
        
    except Exception as e:
        logger.error(f"更新选手统计数据失败: {str(e)}", exc_info=True)
        return False


def update_points_data_from_scraper():
    """
    从官网抓取器更新积分数据并保存到数据库
    """
    try:
        result = fetch_points_data()
        
        if not result or not result.get('success'):
            logger.warning("未获取到积分数据")
            return False
        
        points_data = result.get('data', {})
        
        if not points_data:
            logger.warning("积分数据为空")
            return False
        
        # 保存每种类型的积分数据
        saved_count = 0
        updated_count = 0
        for points_type, team_data in points_data.items():
            if not team_data:
                continue
            
            points_obj, created = PointsData.objects.update_or_create(
                points_type=points_type,
                defaults={
                    'team_data': team_data,
                }
            )
            
            if created:
                saved_count += 1
                logger.info(f"创建新积分数据记录: {points_type}")
            else:
                updated_count += 1
                logger.info(f"更新积分数据记录: {points_type}")
        
        logger.info(f"成功保存积分数据: 新建 {saved_count} 条, 更新 {updated_count} 条")
        return True
        
    except Exception as e:
        logger.error(f"更新积分数据失败: {str(e)}", exc_info=True)
        return False


def update_current_season_schedule():
    """
    更新当前赛季的所有赛程数据
    """
    try:
        from datetime import datetime
        now = datetime.now()
        current_year = now.year
        
        # 当前赛季：当前年的9-12月 + 下一年的1-5月
        # 如果当前是1-5月，则赛季是上一年9月到当前年5月
        # 如果当前是6-12月，则赛季是当前年9月到下一年5月
        
        if now.month >= 9:
            # 当前赛季从今年9月开始
            start_year = current_year
            end_year = current_year + 1
        else:
            # 当前赛季从去年9月开始
            start_year = current_year - 1
            end_year = current_year
        
        logger.info(f"更新当前赛季赛程数据: {start_year}年9月 - {end_year}年5月")
        
        total_saved = 0
        total_updated = 0
        
        # 抓取开始年份的9-12月
        for month in range(9, 13):
            schedule_data = update_schedule_from_scraper(year=start_year, month=month)
            if schedule_data:
                total_saved += len(schedule_data)
        
        # 抓取结束年份的1-5月
        for month in range(1, 6):
            schedule_data = update_schedule_from_scraper(year=end_year, month=month)
            if schedule_data:
                total_saved += len(schedule_data)
        
        logger.info(f"当前赛季赛程数据更新完成: 共 {total_saved} 场比赛")
        return True
        
    except Exception as e:
        logger.error(f"更新当前赛季赛程数据失败: {str(e)}", exc_info=True)
        return False


def update_all_mleague_data(include_historical_schedule: bool = True):
    """
    更新所有M-League数据
    
    Args:
        include_historical_schedule: 是否包含历史赛季的赛程数据
    """
    results = {
        'rankings': False,
        'player_stats': False,
        'points': False,
        'current_season_schedule': False,
        'historical_schedule': []
    }
    
    try:
        # 1. 更新排名数据
        logger.info("开始更新排名数据...")
        results['rankings'] = update_rankings_from_scraper()
        
        # 2. 更新选手统计数据
        logger.info("开始更新选手统计数据...")
        results['player_stats'] = update_player_stats_from_scraper()
        
        # 3. 更新积分数据
        logger.info("开始更新积分数据...")
        results['points'] = update_points_data_from_scraper()
        
        # 4. 更新当前赛季赛程数据
        logger.info("开始更新当前赛季赛程数据...")
        results['current_season_schedule'] = update_current_season_schedule()
        
        # 5. 更新历史赛季赛程数据（可选）
        if include_historical_schedule:
            logger.info("开始更新历史赛季赛程数据...")
            from datetime import datetime
            current_year = datetime.now().year
            
            # 从2018年开始到去年
            for year in range(2018, current_year):
                logger.info(f"更新 {year} 年历史赛季数据...")
                schedule_data = update_schedule_from_scraper(year=year)
                results['historical_schedule'].append({
                    'year': year,
                    'count': len(schedule_data) if schedule_data else 0,
                    'success': bool(schedule_data)
                })
        
        logger.info("所有M-League数据更新完成")
        return results
        
    except Exception as e:
        logger.error(f"更新所有M-League数据失败: {str(e)}", exc_info=True)
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

