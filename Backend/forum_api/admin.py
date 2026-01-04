from django.contrib import admin
from .models import ForumSection, ForumPost, ForumReply
from auth_api.admin_site import admin_site


@admin.register(ForumSection)
class ForumSectionAdmin(admin.ModelAdmin):
    """论坛板块管理（支持添加和修改）"""
    list_display = ['title', 'name', 'order', 'post_count']
    search_fields = ['title', 'name', 'description']
    fields = ['name', 'title', 'description', 'icon', 'order']
    list_editable = ['order']  # 允许在列表中直接编辑排序
    ordering = ['order', 'id']

    def post_count(self, obj):
        """显示板块下的帖子数量"""
        return obj.posts.count()
    post_count.short_description = '帖子数'

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists()

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists()

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists() or request.user.is_staff


@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    """论坛帖子管理（只读，可删除，但可修改是否热门）"""
    list_display = ['title', 'author', 'section', 'views', 'replies_count', 'likes', 'is_hot', 'created_at']
    list_filter = ['section', 'is_hot', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    list_editable = ['is_hot']  # 允许在列表中直接编辑是否热门
    readonly_fields = ['title', 'section', 'author', 'content', 'tags', 'views', 'replies_count', 'likes', 'created_at', 'updated_at']
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'section', 'author', 'content', 'tags')
        }),
        ('统计信息', {
            'fields': ('views', 'replies_count', 'likes', 'is_hot')  # is_hot 不在 readonly_fields 中，所以可以编辑
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    ordering = ['-created_at']

    def has_add_permission(self, request):
        """禁用添加功能"""
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists()

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists() or request.user.is_staff


@admin.register(ForumReply)
class ForumReplyAdmin(admin.ModelAdmin):
    """帖子回复管理（只读，可删除）"""
    list_display = ['id', 'post', 'author', 'parent_id', 'likes', 'created_at']
    list_filter = ['created_at', 'post__section']
    search_fields = ['content', 'author__username', 'post__title']
    readonly_fields = ['post', 'author', 'parent', 'content', 'likes', 'created_at']
    fields = ['post', 'author', 'parent', 'content', 'likes', 'created_at']
    ordering = ['-created_at']

    def parent_id(self, obj):
        """显示父回复ID，格式：回复<id>"""
        return f'回复{obj.parent_id}' if obj.parent else '-'
    parent_id.short_description = '父回复ID'

    def has_add_permission(self, request):
        """禁用添加功能"""
        return False

    def has_change_permission(self, request, obj=None):
        """禁用修改功能"""
        return False

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['forum_moderator', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['moderator', 'forum_moderator']).exists() or request.user.is_staff





# 在模块加载完成后，将模型注册到自定义admin_site
from django.apps import apps
from django.core.management import execute_from_command_line
import sys

def register_to_custom_admin():
    from auth_api.admin_site import admin_site
    # 取消默认注册
    try:
        admin.site.unregister(ForumSection)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(ForumPost)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(ForumReply)
    except admin.sites.NotRegistered:
        pass
    # 注册到自定义admin_site
    admin_site.register(ForumSection, ForumSectionAdmin)
    admin_site.register(ForumPost, ForumPostAdmin)
    admin_site.register(ForumReply, ForumReplyAdmin)

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
        if self.name == "forum_api":
            register_to_custom_admin()
        return result
    AppConfig.ready = custom_ready
