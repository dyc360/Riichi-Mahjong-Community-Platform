# news_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 公共API
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('articles/', views.ArticleListView.as_view(), name='article-list'),
    path('articles/<int:pk>/', views.ArticleDetailView.as_view(), name='article-detail'),
    path('industry/', views.IndustryNewsView.as_view(), name='industry-news'),
    path('m-league/rankings/', views.MLeagueRankingView.as_view(), name='mleague-rankings'),
    path('majsoul/', views.MajsoulNewsView.as_view(), name='majsoul-news'),
    path('home/', views.news_home_data, name='news-home-data'),
]