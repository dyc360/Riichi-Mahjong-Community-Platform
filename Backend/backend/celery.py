"""
Celery配置文件
用于配置定时任务
"""
import os
from celery import Celery
from celery.schedules import crontab

# 设置Django的默认设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# 从Django设置中加载配置
app.config_from_object('django.conf:settings', namespace='CELERY')

# 自动发现任务
app.autodiscover_tasks()

# 配置定时任务
app.conf.beat_schedule = {
    # 每天凌晨0点更新所有M-League数据（不包括历史赛季）
    'update-mleague-all-daily': {
        'task': 'mleague.tasks.celery_update_all_current',
        'schedule': crontab(hour=0, minute=0),  # 每天凌晨0点
    },
}

# 时区设置
app.conf.timezone = 'Asia/Shanghai'
