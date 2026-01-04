from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Naze300Question, UserNazeProgress
from auth_api.admin_site import admin_site


class Naze300QuestionAdminForm(forms.ModelForm):
    """自定义表单，添加一些验证和帮助文本"""

    class Meta:
        model = Naze300Question
        fields = '__all__'
        widgets = {
            'correct_reason': forms.Textarea(attrs={'rows': 4}),
            'additional_notes': forms.Textarea(attrs={'rows': 3}),
            'discard_options': forms.Textarea(attrs={
                'rows': 3,
                'placeholder': '例如: ["1m", "9m", "1p"]'
            }),
        }

    def clean_discard_options(self):
        """验证discard_options格式"""
        data = self.cleaned_data.get('discard_options')
        if not isinstance(data, list):
            raise forms.ValidationError("必须是列表格式")
        if len(data) < 2:
            raise forms.ValidationError("至少需要2个选项")
        if self.cleaned_data.get('correct_discard') not in data:
            raise forms.ValidationError("正确答案必须在选项列表中")
        return data

    def clean_question_id(self):
        """验证question_id唯一性"""
        question_id = self.cleaned_data.get('question_id')
        if question_id:
            existing = Naze300Question.objects.filter(question_id=question_id)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise forms.ValidationError(f"题目ID {question_id} 已存在")
        return question_id


class Naze300QuestionAdmin(admin.ModelAdmin):
    """何切300问题目的管理界面"""

    form = Naze300QuestionAdminForm
    list_display = [
        'question_id', 'title', 'difficulty_display', 'category_display',
        'correct_rate_display', 'total_attempts', 'created_at'
    ]
    list_filter = ['difficulty', 'category', 'created_at']
    search_fields = ['question_id', 'title', 'hand_tiles']
    ordering = ['question_id']
    readonly_fields = ['total_attempts', 'correct_attempts', 'created_at', 'updated_at']

    fieldsets = (
        ('基本信息', {
            'fields': ('question_id', 'title', 'difficulty', 'category')
        }),
        ('题目内容', {
            'fields': ('hand_tiles', 'discard_options', 'correct_discard'),
            'classes': ('collapse',)
        }),
        ('解析说明', {
            'fields': ('correct_reason', 'additional_notes'),
            'classes': ('collapse',)
        }),
        ('统计信息', {
            'fields': ('total_attempts', 'correct_attempts', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """检查添加权限"""
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['practice_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='practice-editor').exists()

    def has_change_permission(self, request, obj=None):
        """检查编辑权限"""
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['practice_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name='practice-editor').exists()

    def has_delete_permission(self, request, obj=None):
        """检查删除权限"""
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['practice-editor', 'moderator']).exists()

    def has_view_permission(self, request, obj=None):
        """检查查看权限"""
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.name in ['practice_editor', 'content_manager', 'super_admin']:
            return True
        return request.user.groups.filter(name__in=['practice-editor', 'moderator']).exists() or request.user.is_staff

    def difficulty_display(self, obj):
        """显示难度中文"""
        return {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        }.get(obj.difficulty, obj.difficulty)
    difficulty_display.short_description = '难度'

    def category_display(self, obj):
        """显示分类中文"""
        return {
            'basic': '基础',
            'intermediate': '进阶',
            'advanced': '高级'
        }.get(obj.category, obj.category)
    category_display.short_description = '分类'

    def correct_rate_display(self, obj):
        """显示正确率"""
        if obj.total_attempts == 0:
            return '0%'
        rate = round((obj.correct_attempts / obj.total_attempts) * 100, 1)
        return f'{rate}%'
    correct_rate_display.short_description = '正确率'

    def hand_tiles_preview(self, obj):
        """手牌预览"""
        if obj.hand_tiles:
            return format_html(
                '<img src="/api/mahjong/images/{}/" style="height: 40px;" alt="手牌预览" />',
                obj.hand_tiles
            )
        return '-'
    hand_tiles_preview.short_description = '手牌预览'

    def get_queryset(self, request):
        """优化查询"""
        return super().get_queryset(request).select_related('created_by')

    def save_model(self, request, obj, form, change):
        """保存时设置创建者"""
        if not change:  # 新建
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class UserNazeProgressAdmin(admin.ModelAdmin):
    """用户何切300问进度管理"""

    list_display = [
        'user', 'question_link', 'status_display',
        'attempts_count', 'is_correct_display', 'completed_at'
    ]
    list_filter = ['status', 'is_correct', 'completed_at']
    search_fields = ['user__username', 'question__title']
    readonly_fields = ['first_attempted_at', 'completed_at']

    def question_link(self, obj):
        """题目链接"""
        return format_html(
            '<a href="/admin/mahjong_api/naze300question/{}/change/">Q{}: {}</a>',
            obj.question.id, obj.question.question_id, obj.question.title
        )
    question_link.short_description = '题目'

    def status_display(self, obj):
        """状态显示"""
        return {
            'not_started': '未开始',
            'in_progress': '进行中',
            'completed': '已完成'
        }.get(obj.status, obj.status)
    status_display.short_description = '状态'

    def is_correct_display(self, obj):
        """正确性显示"""
        if obj.is_correct is None:
            return '-'
        return '✓' if obj.is_correct else '✗'
    is_correct_display.short_description = '是否正确'

    def get_queryset(self, request):
        """优化查询"""
        return super().get_queryset(request).select_related('user', 'question')


# 在模块加载完成后，将模型注册到自定义admin_site
from django.apps import apps
from django.core.management import execute_from_command_line
import sys

def register_to_custom_admin():
    from auth_api.admin_site import admin_site
    # 取消默认注册
    try:
        admin.site.unregister(Naze300Question)
    except admin.sites.NotRegistered:
        pass
    try:
        admin.site.unregister(UserNazeProgress)
    except admin.sites.NotRegistered:
        pass
    # 注册到自定义admin_site
    admin_site.register(Naze300Question, Naze300QuestionAdmin)
    admin_site.register(UserNazeProgress, UserNazeProgressAdmin)

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
        if self.name == 'mahjong_api':
            register_to_custom_admin()
        return result
    AppConfig.ready = custom_ready