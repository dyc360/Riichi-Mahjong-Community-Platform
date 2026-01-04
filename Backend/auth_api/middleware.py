import re
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .utils import JWTManager


class JWTAuthentication:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 排除不需要认证的路径
        excluded_paths = [
            '/api/auth/register/',
            '/api/auth/login/',
            '/api/m-league/',  # M-League数据API公开访问
            '/api/news_api/',   # 新闻API公开访问
            '/api/mahjong/',    # 麻将相关API使用session认证
            '/admin/',
            '/health/',
            '/'
        ]

        path = request.path
        should_authenticate = True

        for excluded_path in excluded_paths:
            if path.startswith(excluded_path):
                should_authenticate = False
                break

        if should_authenticate:
            # 从请求头获取 token
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')

            if not auth_header.startswith('Bearer '):
                return JsonResponse(
                    {
                        'success': False,
                        'message': '未提供认证token'
                    },
                    status=401,
                )

            token = auth_header.split(' ')[1]

            try:
                user = JWTManager.get_user_from_token(token)
                # 同时设置 Django 原始 request 和 DRF Request 可见的用户，用于 DRF 的认证链
                request.user = user
                setattr(request, '_force_auth_user', user)
                setattr(request, '_force_auth_token', token)
            except Exception as e:
                return JsonResponse(
                    {
                        'success': False,
                        'message': str(e)
                    },
                    status=401,
                )

        response = self.get_response(request)
        return response