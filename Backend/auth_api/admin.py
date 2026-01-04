# auth_api/admin.py
from django.contrib import admin
from django.apps import apps
from .models import CustomUser, AdminRole

# 首先定义Admin类
class CustomUserAdmin(admin.ModelAdmin):
    # 列表页
    list_display = ('id', 'username', 'email', 'role', 'current_rank', 'is_active', 'date_joined')
    list_display_links = ('id', 'username')
    list_filter = ('is_active', 'is_staff', 'role', 'current_rank')
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
            'fields': ('is_active', 'is_staff', 'is_superuser', 'role')
        }),
    )

    # 只读字段
    readonly_fields = ('password', 'date_joined', 'last_login')


class AdminRoleAdmin(admin.ModelAdmin):
    # 列表页
    list_display = ('name', 'display_name', 'is_active', 'created_at')
    list_display_links = ('name', 'display_name')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'display_name', 'description')
    list_per_page = 20

    # 编辑页字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('权限配置', {
            'fields': ('permissions', 'groups'),
            'description': '选择该角色拥有的权限和关联的用户组'
        }),
    )

    # 过滤器
    filter_horizontal = ('permissions', 'groups')

    # 只读字段
    readonly_fields = ('created_at', 'updated_at')


# 在模块加载完成后，将模型注册到自定义admin_site
from django.apps import apps
from django.core.management import execute_from_command_line
import sys

def register_to_custom_admin():
    from .admin_site import admin_site
    # 取消默认注册
    try:
        admin.site.unregister(CustomUser)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(AdminRole)
    except admin.sites.NotRegistered:
        pass
    # 注册到自定义admin_site
    admin_site.register(CustomUser, CustomUserAdmin)
    admin_site.register(AdminRole, AdminRoleAdmin)

# 检查是否在迁移模式
is_migration = 'migrate' in sys.argv or 'makemigrations' in sys.argv

# 如果Django已经准备好且不在迁移模式，立即注册
if apps.ready and not is_migration:
    register_to_custom_admin()
elif not is_migration:
    # 否则在app ready时注册
    from django.apps.config import AppConfig
    original_ready = AppConfig.ready
    def custom_ready(self):
        result = original_ready(self)
        if self.name == 'auth_api':
            register_to_custom_admin()
        return result
    AppConfig.ready = custom_ready