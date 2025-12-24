# news_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 公共API
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('articles/', views.ArticleListView.as_view(), name='article-list'),
    path('articles/<int:id>/', views.ArticleDetailView.as_view(), name='article-detail'),
    path('industry/', views.IndustryNewsView.as_view(), name='industry-news'),
    #path('m-league/rankings/', views.MLeagueRankingView.as_view(), name='mleague-rankings'),
    path('majsoul/', views.MajsoulNewsView.as_view(), name='majsoul-news'),
    path('home/', views.news_home_data, name='news-home-data'),

    # 管理API - 需要相应权限
    path('admin/articles/', views.ArticleCreateView.as_view(), name='article-create'),
    path('admin/articles/<int:pk>/', views.ArticleUpdateView.as_view(), name='article-update'),
    path('admin/articles/<int:pk>/delete/', views.ArticleDeleteView.as_view(), name='article-delete'),
    path('admin/categories/', views.CategoryCreateView.as_view(), name='category-create'),
    path('admin/categories/<int:pk>/', views.CategoryUpdateView.as_view(), name='category-update'),

    # 爬取API
    path('scrape/majsoul/', views.scrape_majsoul_news, name='scrape-majsoul-news'),
]