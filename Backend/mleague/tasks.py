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
            team_rank, created = TeamRank.objects.update_or_create(
                rank=data['rank'],
                season=season,
                defaults={
                    'team_name': data['team_name'],
                    'score': data['score'],
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


def update_schedule_from_scraper(start_date: str = None, end_date: str = None):
    """
    从网络抓取器更新赛程数据
    注意：需要先创建Match模型（如果还没有的话）
    """
    try:
        scraper = MLeagueOfficialScraper()
        schedule_data = scraper.fetch_schedule(start_date=start_date, end_date=end_date)
        
        # TODO: 保存到数据库
        # 需要创建Match模型来存储赛程数据
        
        logger.info(f"成功获取 {len(schedule_data)} 条赛程数据")
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
        """Celery任务：更新赛程"""
        return update_schedule_from_scraper()
        
except ImportError:
    # 如果没有安装Celery，使用Django的定时任务
    pass

