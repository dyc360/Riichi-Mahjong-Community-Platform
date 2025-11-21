from django.contrib import admin
from django.urls import path, include
from authentication.views import home_view, HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', home_view, name='home'),
]