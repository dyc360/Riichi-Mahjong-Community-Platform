# auth_api/admin.py
from django.contrib import admin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    # 列表页
    list_display = ('id', 'username', 'email', 'current_rank', 'is_active', 'date_joined')
    list_display_links = ('id', 'username')
    list_filter = ('is_active', 'is_staff', 'current_rank')
    search_fields = ('username', 'email')
    list_per_page = 20

    # 编辑页字段分组
    fieldsets = (
        ('基础信息', {
            'fields': ('username', 'email', 'password')
        }),
        ('个人资料', {
            'fields': ('avatar', 'join_date')
        }),
        ('练习统计', {
            'fields': ('completed_exercises', 'average_accuracy', 'current_rank')
        }),
        ('论坛统计', {
            'fields': ('topics_published', 'replies_count', 'likes_received')
        }),
        ('账户状态', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
    )

    # 只读字段
    readonly_fields = ('password', 'date_joined', 'last_login')