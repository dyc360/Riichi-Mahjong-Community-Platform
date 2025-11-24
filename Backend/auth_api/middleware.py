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
                return JsonResponse({
                    'success': False,
                    'message': '未提供认证token'
                }, status=401)

            token = auth_header.split(' ')[1]

            try:
                user = JWTManager.get_user_from_token(token)
                request.user = user
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': str(e)
                }, status=401)

        response = self.get_response(request)
        return response