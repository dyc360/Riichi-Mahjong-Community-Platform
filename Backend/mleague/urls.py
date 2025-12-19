"""
M-League抓取器URL配置
"""
from django.urls import path
from . import views

app_name = 'mleague'

urlpatterns = [
    # 数据抓取触发接口（仅管理员）
    path('trigger/rankings/', views.trigger_scrape_rankings, name='trigger-rankings'),
    path('trigger/schedule/', views.trigger_scrape_schedule, name='trigger-schedule'),
    path('trigger/player-stats/', views.trigger_scrape_player_stats, name='trigger-player-stats'),
    path('trigger/points/', views.trigger_scrape_points, name='trigger-points'),
    path('trigger/all/', views.trigger_scrape_all, name='trigger-all'),
    
    # 数据查询接口（从数据库读取）
    path('rankings/', views.MLeagueRankingView.as_view(), name='m-league-rankings'),
    path('player-stats/', views.MLeaguePlayerStatsView.as_view(), name='m-league-player-stats'),
    path('player-stats/<str:player_name>/', views.MLeaguePlayerDetailView.as_view(), name='m-league-player-detail'),
    path('schedule/', views.MLeagueScheduleView.as_view(), name='m-league-schedule'),
    path('points/', views.MLeaguePointsView.as_view(), name='m-league-points'),
    
    # 调试和测试接口
    path('test/', views.test_scraper, name='test-scraper'),
    path('debug-html/', views.debug_html_structure, name='debug-html'),
]

