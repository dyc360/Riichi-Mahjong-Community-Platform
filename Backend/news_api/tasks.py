"""
定时任务：定期抓取雀魂新闻数据
使用Celery或Django的定时任务
"""
import logging
from django.utils import timezone
from .scraper import MajSoulNewsScraper
from .models import MajSoulNews

logger = logging.getLogger(__name__)


def update_majsoul_news_from_scraper():
    """
    从官网抓取器更新最新新闻数据
    """
    try:
        # 创建爬取器
        scraper = MajSoulNewsScraper()

        # 抓取最新数据
        news_data = scraper.fetch_latest_news(limit=20)

        if not news_data:
            logger.warning("未获取到新闻数据")
            return False

        # 更新数据库
        created_count = 0
        updated_count = 0

        for data in news_data:
            # 使用链接作为唯一标识
            news_item, created = MajSoulNews.objects.update_or_create(
                link=data['link'],
                defaults={
                    'title': data['title'],
                    'description': data.get('description', ''),
                    'image_url': data.get('image_url', ''),
                    'published_at': data.get('published_at') or timezone.now(),
                    'category': data.get('category', ''),
                    'source': data.get('source', '雀魂官网'),
                    'is_active': True,
                }
            )

            if created:
                logger.info(f"创建新新闻: {news_item.title}")
                created_count += 1
            else:
                logger.info(f"更新新闻: {news_item.title}")
                updated_count += 1

        logger.info(f"成功更新新闻数据: 新建 {created_count} 条, 更新 {updated_count} 条")
        return True

    except Exception as e:
        logger.error(f"更新新闻数据失败: {str(e)}", exc_info=True)
        return False


# 如果使用Celery，可以这样定义任务
try:
    from celery import shared_task

    @shared_task
    def celery_update_majsoul_news():
        """Celery任务：更新最新新闻数据"""
        return update_majsoul_news_from_scraper()

except ImportError:
    # 如果没有安装Celery，使用Django的定时任务
    pass