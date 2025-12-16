from django.contrib import admin
from .models import ForumSection, ForumPost, ForumReply


@admin.register(ForumSection)
class ForumSectionAdmin(admin.ModelAdmin):
    """论坛板块管理（只读，可删除）"""
    list_display = ['title', 'name', 'order', 'post_count']
    search_fields = ['title', 'name', 'description']
    fields = ['name', 'title', 'description', 'icon', 'order']
    readonly_fields = ['name', 'title', 'description', 'icon', 'order']
    ordering = ['order', 'id']

    def post_count(self, obj):
        """显示板块下的帖子数量"""
        return obj.posts.count()
    post_count.short_description = '帖子数'

    def has_change_permission(self, request, obj=None):
        """禁用修改功能"""
        return False

    def has_add_permission(self, request):
        """禁用添加功能"""
        return False


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

    def has_change_permission(self, request, obj=None):
        """允许修改（但只能修改 is_hot 字段，其他字段在 readonly_fields 中）"""
        return True

    def has_add_permission(self, request):
        """禁用添加功能"""
        return False


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

    def has_change_permission(self, request, obj=None):
        """禁用修改功能"""
        return False

    def has_add_permission(self, request):
        """禁用添加功能"""
        return False


