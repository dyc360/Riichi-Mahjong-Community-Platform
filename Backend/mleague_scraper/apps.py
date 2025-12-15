from django.apps import AppConfig


class MleagueScraperConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mleague_scraper'  # 必须与目录名匹配
    verbose_name = 'M-League数据抓取'

