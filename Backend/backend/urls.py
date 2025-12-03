# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from auth_api.views import home_view, HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_api.urls')),
    path('api/mahjong/', include('mahjong_api.urls')),
    path('api/news/', include('news_api.urls')),  # 添加新闻API
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', home_view, name='home'),
]

# 开发环境下的媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)