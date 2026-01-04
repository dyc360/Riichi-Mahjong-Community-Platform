# auth_api/permissions.py
from rest_framework import permissions
from django.contrib.auth.models import Group
from .models import AdminRole


class IsNewsEditor(permissions.BasePermission):
    """
    允许新闻编辑者访问
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='news-editor').exists() or request.user.is_superuser


class IsPracticeEditor(permissions.BasePermission):
    """
    允许练习题目编辑者访问
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='practice-editor').exists() or request.user.is_superuser


class IsModerator(permissions.BasePermission):
    """
    允许版主访问（可以删除帖子等）
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='moderator').exists() or request.user.is_superuser


class IsAdmin(permissions.BasePermission):
    """
    允许管理员访问
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='admin').exists() or request.user.is_superuser


class HasNewsPermissions(permissions.BasePermission):
    """
    检查用户是否有新闻相关权限
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_groups = ['news-editor', 'moderator', 'admin']
        return (request.user.groups.filter(name__in=allowed_groups).exists() or
                request.user.is_superuser)


class HasPracticePermissions(permissions.BasePermission):
    """
    检查用户是否有练习题目相关权限
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_groups = ['practice-editor', 'moderator', 'admin']
        return (request.user.groups.filter(name__in=allowed_groups).exists() or
                request.user.is_superuser)


class HasModerationPermissions(permissions.BasePermission):
    """
    检查用户是否有版主权限
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_groups = ['moderator', 'admin']
        return (request.user.groups.filter(name__in=allowed_groups).exists() or
                request.user.is_superuser)


# 基于AdminRole的权限类
class HasRolePermission(permissions.BasePermission):
    """
    基于AdminRole检查权限的基类
    """
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        if request.user.role and request.user.role.name in self.allowed_roles:
            return True

        return False


class IsSuperAdmin(HasRolePermission):
    """
    超级管理员权限
    """
    allowed_roles = ['super_admin']


class IsNewsEditorRole(HasRolePermission):
    """
    新闻编辑者角色权限
    """
    allowed_roles = ['news_editor', 'super_admin', 'content_manager']


class IsPracticeEditorRole(HasRolePermission):
    """
    练习编辑者角色权限
    """
    allowed_roles = ['practice_editor', 'super_admin', 'content_manager']


class IsModeratorRole(HasRolePermission):
    """
    版主角色权限
    """
    allowed_roles = ['moderator', 'super_admin', 'forum_moderator', 'content_manager']


class IsForumModeratorRole(HasRolePermission):
    """
    论坛版主角色权限
    """
    allowed_roles = ['forum_moderator', 'moderator', 'super_admin', 'content_manager']


class IsContentManagerRole(HasRolePermission):
    """
    内容管理员角色权限
    """
    allowed_roles = ['content_manager', 'super_admin']