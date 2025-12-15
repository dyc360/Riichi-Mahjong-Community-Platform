"""
M-League抓取器URL配置
"""
from django.urls import path
from . import views

app_name = 'mleague'

urlpatterns = [
    path('trigger/rankings/', views.trigger_scrape_rankings, name='trigger-rankings'),
    path('trigger/schedule/', views.trigger_scrape_schedule, name='trigger-schedule'),
    path('rankings/', views.MLeagueRankingView.as_view(), name='m-league-rankings'),
    path('player-stats/', views.MLeaguePlayerStatsView.as_view(), name='m-league-player-stats'),
    path('player-stats/<str:player_name>/', views.MLeaguePlayerDetailView.as_view(), name='m-league-player-detail'),
    path('schedule/', views.MLeagueScheduleView.as_view(), name='m-league-schedule'),
    path('points/', views.MLeaguePointsView.as_view(), name='m-league-points'),
    path('debug-html/', views.debug_html_structure, name='debug-html'),
]

