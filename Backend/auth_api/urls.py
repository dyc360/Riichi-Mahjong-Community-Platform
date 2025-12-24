# auth_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('admin/login/', views.LoginView.as_view(), name='admin-login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),  # 支持 GET 和 PUT
    path('stats/update/', views.UpdateStatsView.as_view(), name='update-stats'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('users/', views.UserListView.as_view(), name='user-list'),
]