from django.contrib import admin
from django.urls import path, include
from auth_api.views import home_view, HealthCheckView
from auth_api.admin_site import admin_site
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin_site.urls),
    path('api/news_api/', include('news_api.urls')),
    path('api/news/', include('news_api.urls')),  # 兼容前端使用的URL
    path('api/auth/', include('auth_api.urls')),
    path('api/mahjong/', include('mahjong_api.urls')),
    path('api/m-league/', include('mleague.urls')),  # M-League抓取器API
    path('api/forum/', include('forum_api.urls')),   # 论坛API
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', home_view, name='home'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
