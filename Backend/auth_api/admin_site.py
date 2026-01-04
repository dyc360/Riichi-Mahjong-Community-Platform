from django.contrib.admin import AdminSite
from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class RoleBasedAdminSite(AdminSite):
    """
    基于角色的AdminSite，根据用户的角色过滤可用的应用和模型
    """
    site_header = _("Riichi Mahjong Community - 管理员后台")
    site_title = _("Riichi Mahjong Community")
    index_title = _("欢迎来到管理员后台")

    def get_app_list(self, request, app_label=None):
        """
        根据用户角色过滤应用列表
        """
        app_list = super().get_app_list(request, app_label)

        if request.user.is_superuser:
            # 超级用户可以看到所有应用
            return app_list

        # 获取用户角色
        user_role = getattr(request.user, 'role', None)
        user_groups = request.user.groups.all()

        # 定义角色权限映射
        role_permissions = {
            'super_admin': ['auth_api', 'mahjong_api', 'news_api', 'forum_api', 'mleague'],
            'news_editor': ['news_api'],
            'practice_editor': ['mahjong_api'],
            'moderator': ['forum_api', 'news_api'],
            'forum_moderator': ['forum_api'],
            'content_manager': ['auth_api', 'mahjong_api', 'news_api', 'forum_api', 'mleague'],
        }

        # 获取用户允许的应用
        allowed_apps = set()

        # 检查角色权限
        if user_role and user_role.name in role_permissions:
            allowed_apps.update(role_permissions[user_role.name])

        # 检查组权限（向后兼容）
        group_app_mapping = {
            'news-editor': 'news_api',
            'practice-editor': 'mahjong_api',
            'moderator': 'forum_api',
            'forum_moderator': 'forum_api',
        }

        for group in user_groups:
            if group.name in group_app_mapping:
                allowed_apps.add(group_app_mapping[group.name])

        # 如果用户没有任何权限，返回空列表
        if not allowed_apps:
            return []

        # 过滤应用列表
        filtered_app_list = []
        for app in app_list:
            if app['app_label'] in allowed_apps:
                # 进一步过滤模型
                filtered_models = []
                for model in app['models']:
                    raw_model_name = model.get('model_name') or model.get('object_name')
                    if not raw_model_name:
                        continue
                    model_name = raw_model_name.lower()
                    if self._user_has_model_permission(request.user, app['app_label'], model_name):
                        filtered_models.append(model)

                if filtered_models:
                    app_copy = app.copy()
                    app_copy['models'] = filtered_models
                    filtered_app_list.append(app_copy)

        return filtered_app_list

    def _user_has_model_permission(self, user, app_label, model_name):
        """
        检查用户是否有特定模型的权限
        """
        if user.is_superuser:
            return True

        # 获取用户角色
        user_role = getattr(user, 'role', None)
        user_groups = user.groups.all()

        # 定义模型权限映射
        model_permissions = {
            # auth_api
            ('auth_api', 'customuser'): ['super_admin', 'content_manager'],
            ('auth_api', 'adminrole'): ['super_admin'],

            # mahjong_api
            ('mahjong_api', 'naze300question'): ['practice_editor', 'content_manager', 'super_admin'],
            ('mahjong_api', 'usernazeprogress'): ['practice_editor', 'content_manager', 'super_admin'],

            # news_api
            ('news_api', 'article'): ['news_editor', 'content_manager', 'super_admin'],
            ('news_api', 'category'): ['news_editor', 'content_manager', 'super_admin'],
            ('news_api', 'teamrank'): ['news_editor', 'content_manager', 'super_admin'],

            # forum_api
            ('forum_api', 'forumsection'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],
            ('forum_api', 'forumpost'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],
            ('forum_api', 'forumreply'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],

            # mleague
            ('mleague', 'teamranking'): ['content_manager', 'super_admin'],
            ('mleague', 'match'): ['content_manager', 'super_admin'],
            ('mleague', 'teamplayerstats'): ['content_manager', 'super_admin'],
            ('mleague', 'pointsdata'): ['content_manager', 'super_admin'],
        }

        # 检查角色权限
        key = (app_label, model_name.lower())
        if key in model_permissions:
            allowed_roles = model_permissions[key]
            if user_role and user_role.name in allowed_roles:
                return True

        # 检查组权限（向后兼容）
        group_model_mapping = {
            ('news-editor', 'news_api'): ['article', 'category', 'teamrank'],
            ('practice-editor', 'mahjong_api'): ['naze300question', 'usernazeprogress'],
            ('moderator', 'forum_api'): ['forumsection', 'forumpost', 'forumreply'],
            ('forum_moderator', 'forum_api'): ['forumsection', 'forumpost', 'forumreply'],
        }

        for group in user_groups:
            group_key = (group.name, app_label)
            if group_key in group_model_mapping:
                if model_name.lower() in group_model_mapping[group_key]:
                    return True

        return False

    def has_permission(self, request):
        """
        检查用户是否有访问admin的权限
        """
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # 检查是否有角色或相关组
        user_role = getattr(request.user, 'role', None)
        user_groups = request.user.groups.all()

        # 定义有admin访问权限的角色和组
        admin_roles = ['super_admin', 'news_editor', 'practice_editor', 'moderator', 'forum_moderator', 'content_manager']
        admin_groups = ['news-editor', 'practice-editor', 'moderator', 'forum_moderator']

        if user_role and user_role.name in admin_roles:
            return True

        if any(group.name in admin_groups for group in user_groups):
            return True

        return False


# 创建全局admin站点实例
admin_site = RoleBasedAdminSite(name='admin')