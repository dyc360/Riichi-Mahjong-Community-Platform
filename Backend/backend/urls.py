from django.contrib import admin
from django.urls import path, include
from auth_api.views import home_view, HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_api.urls')),
    path('api/mahjong/', include('mahjong_api.urls')),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', home_view, name='home'),
]