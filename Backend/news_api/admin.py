from django.contrib import admin

# Register your models here.
# news_api/admin.py
from django.contrib import admin
from .models import Category, Article, TeamRank
from auth_api.admin_site import admin_site


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'label', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'label']
    fields = ['name', 'slug', 'label', 'description']

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='news-editor').exists()

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='news-editor').exists()

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists() or request.user.is_staff


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'status', 'published_at', 'views']
    list_filter = ['category', 'status', 'published_at']
    search_fields = ['title', 'content']
    readonly_fields = ['views', 'created_at', 'updated_at']

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='news-editor').exists()

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='news-editor').exists()

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['news_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists() or request.user.is_staff

    def save_model(self, request, obj, form, change):
        if not obj.author_id:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(TeamRank)
class TeamRankAdmin(admin.ModelAdmin):
    list_display = ['rank', 'team_name', 'score', 'season', 'last_updated']
    list_editable = ['score']
    ordering = ['season', 'rank']

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists()

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists()

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['news-editor', 'moderator']).exists() or request.user.is_staff


# 在模块加载完成后，将模型注册到自定义admin_site
from django.apps import apps
from django.core.management import execute_from_command_line
import sys

def register_to_custom_admin():
    from auth_api.admin_site import admin_site
    # 取消默认注册
    try:
        admin.site.unregister(Category)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(Article)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(TeamRank)
    except admin.sites.NotRegistered:
        pass
    # 注册到自定义admin_site
    admin_site.register(Category, CategoryAdmin)
    admin_site.register(Article, ArticleAdmin)
    admin_site.register(TeamRank, TeamRankAdmin)

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
        if self.name == 'news_api':
            register_to_custom_admin()
        return result
    AppConfig.ready = custom_ready