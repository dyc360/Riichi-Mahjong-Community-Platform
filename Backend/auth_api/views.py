from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import login
from django.core.cache import cache
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)
from .utils import JWTManager
from .models import CustomUser


@csrf_exempt
def home_view(request):
    return JsonResponse({
        'success': True,
        'message': '欢迎使用认证系统 API',
        'endpoints': {
            '注册': 'POST /api/auth/register/',
            '登录': 'POST /api/auth/login/',
            '用户信息': 'GET /api/auth/profile/',
            '退出登录': 'POST /api/auth/logout/',
            '管理后台': '/admin/',
            '健康检查': '/health/'
        }
    })


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from datetime import datetime
        return Response({
            'status': 'healthy',
            'service': 'Django Auth API',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()

                # 生成 JWT token
                token = JWTManager.generate_token(user)

                return Response({
                    'success': True,
                    'message': '用户注册成功',
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'message': '注册失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': '注册过程中服务器错误',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserLoginSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.validated_data['user']

                # 登录用户，设置session
                login(request, user)

                # 生成 JWT token
                token = JWTManager.generate_token(user)

                return Response({
                    'success': True,
                    'message': '登录成功',
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_staff': user.is_staff
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': '登录失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': '登录过程中服务器错误',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            cache_key = f"auth_profile_payload:{user.id}"
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response({
                    'success': True,
                    'user': cached_payload
                }, status=status.HTTP_200_OK)

            serializer = UserProfileSerializer(user)
            payload = serializer.data
            cache.set(cache_key, payload, timeout=60)

            return Response({
                'success': True,
                'user': payload
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': '获取用户信息失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            user = request.user
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                user.refresh_from_db()
                cache_key = f"auth_profile_payload:{user.id}"
                cache.delete(cache_key)
                refreshed = UserProfileSerializer(user)
                cache.set(cache_key, refreshed.data, timeout=60)
                return Response({
                    'success': True,
                    'user': refreshed.data
                }, status=status.HTTP_200_OK)

            return Response({
                'success': False,
                'message': '更新失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': '更新用户信息失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # 在实际应用中，您可能想要将 token 加入黑名单
            # 这里只是返回成功消息，前端需要删除本地存储的 token
            return Response({
                'success': True,
                'message': '退出登录成功'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': '退出登录失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]  # 暂时改为所有认证用户都可以访问

    def get(self, request):
        try:
            users = CustomUser.objects.all()
            serializer = UserProfileSerializer(users, many=True)
            return Response({
                'success': True,
                'users': serializer.data,
                'count': users.count()
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': '获取用户列表失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)