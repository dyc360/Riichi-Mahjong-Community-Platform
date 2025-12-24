# auth_api/permissions.py
from rest_framework import permissions
from django.contrib.auth.models import Group


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