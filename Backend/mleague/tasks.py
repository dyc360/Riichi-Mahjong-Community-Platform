"""
定时任务：定期抓取M-League数据
可以使用Celery或Django的定时任务
"""
import logging
from django.utils import timezone
from django.conf import settings
from .scraper import MLeagueOfficialScraper
from news_api.models import TeamRank

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
                logger.info(f"创建新排名记录: {team_rank.team_name}")
            else:
                logger.info(f"更新排名记录: {team_rank.team_name}")
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
                # 生成一个基于日期和队伍的ID
                team_names = [t.get('name', '') for t in data.get('teams', [])]
                match_id = f"{date_str}-{'-'.join(team_names[:2])}"
            
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

