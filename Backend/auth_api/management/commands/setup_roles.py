# auth_api/management/commands/setup_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from auth_api.models import CustomUser


class Command(BaseCommand):
    help = '设置用户角色和权限'

    def handle(self, *args, **options):
        # 定义角色
        roles = {
            'news-editor': '新闻编辑者 - 可以创建和编辑新闻文章',
            'practice-editor': '练习编辑者 - 可以创建和编辑何切题目',
            'moderator': '版主 - 可以管理帖子、用户内容',
            'admin': '管理员 - 完全访问权限'
        }

        # 创建角色组
        for role_name, description in roles.items():
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(f'创建角色组: {role_name} - {description}')
            else:
                self.stdout.write(f'角色组已存在: {role_name}')

        # 获取相关模型的ContentType
        from news_api.models import Article, Category
        from mahjong_api.models import Naze300Question
        from forum_api.models import ForumPost, ForumReply

        article_ct = ContentType.objects.get_for_model(Article)
        category_ct = ContentType.objects.get_for_model(Category)
        question_ct = ContentType.objects.get_for_model(Naze300Question)
        post_ct = ContentType.objects.get_for_model(ForumPost)
        reply_ct = ContentType.objects.get_for_model(ForumReply)

        # 定义权限
        permissions_data = [
            # 新闻相关权限
            ('can_add_article', 'Can add article', article_ct),
            ('can_change_article', 'Can change article', article_ct),
            ('can_delete_article', 'Can delete article', article_ct),
            ('can_publish_article', 'Can publish article', article_ct),

            # 分类权限
            ('can_add_category', 'Can add category', category_ct),
            ('can_change_category', 'Can change category', category_ct),

            # 练习题目权限
            ('can_add_naze300question', 'Can add naze300 question', question_ct),
            ('can_change_naze300question', 'Can change naze300 question', question_ct),
            ('can_delete_naze300question', 'Can delete naze300 question', question_ct),

            # 论坛权限
            ('can_delete_forumpost', 'Can delete forum post', post_ct),
            ('can_delete_forumreply', 'Can delete forum reply', reply_ct),
            ('can_pin_forumpost', 'Can pin forum post', post_ct),
            ('can_lock_forumpost', 'Can lock forum post', post_ct),
        ]

        # 创建权限
        for codename, name, content_type in permissions_data:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                name=name,
                content_type=content_type
            )
            if created:
                self.stdout.write(f'创建权限: {codename}')

        # 分配权限给角色组
        news_editor_group = Group.objects.get(name='news-editor')
        practice_editor_group = Group.objects.get(name='practice-editor')
        moderator_group = Group.objects.get(name='moderator')
        admin_group = Group.objects.get(name='admin')

        # 新闻编辑者权限
        news_permissions = [
            'can_add_article',
            'can_change_article',
            'can_publish_article',
        ]
        for perm_codename in news_permissions:
            try:
                perm = Permission.objects.get(codename=perm_codename)
                news_editor_group.permissions.add(perm)
            except Permission.DoesNotExist:
                self.stdout.write(f'权限不存在: {perm_codename}')

        # 练习编辑者权限
        practice_permissions = [
            'can_add_naze300question',
            'can_change_naze300question',
        ]
        for perm_codename in practice_permissions:
            try:
                perm = Permission.objects.get(codename=perm_codename)
                practice_editor_group.permissions.add(perm)
            except Permission.DoesNotExist:
                self.stdout.write(f'权限不存在: {perm_codename}')

        # 版主权限
        moderator_permissions = [
            'can_delete_forumpost',
            'can_delete_forumreply',
            'can_pin_forumpost',
            'can_lock_forumpost',
            'can_delete_article',
            'can_delete_naze300question',
        ]
        for perm_codename in moderator_permissions:
            try:
                perm = Permission.objects.get(codename=perm_codename)
                moderator_group.permissions.add(perm)
            except Permission.DoesNotExist:
                self.stdout.write(f'权限不存在: {perm_codename}')

        # 管理员权限 - 所有权限
        admin_permissions = Permission.objects.all()
        admin_group.permissions.set(admin_permissions)

        self.stdout.write(self.style.SUCCESS('角色和权限设置完成！'))

        # 显示角色信息
        self.stdout.write('\n角色说明:')
        self.stdout.write('1. news-editor: 可以创建、编辑和发布新闻文章')
        self.stdout.write('2. practice-editor: 可以创建和编辑何切练习题目')
        self.stdout.write('3. moderator: 可以删除帖子、回复，管理用户内容')
        self.stdout.write('4. admin: 完全访问权限，包括所有管理功能')

        self.stdout.write('\n使用示例:')
        self.stdout.write('python manage.py assign_role username role_name')
        self.stdout.write('例如: python manage.py assign_role john news-editor')