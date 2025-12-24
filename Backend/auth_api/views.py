from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
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


class LoginView(APIView):
    permission_classes = [AllowAny]

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        print("=== 收到登录请求 ===")
        print("请求数据:", request.data)

        try:
            serializer = UserLoginSerializer(data=request.data)
            print("序列化器创建完成")

            if serializer.is_valid():
                print("序列化验证通过")
                user = serializer.validated_data['user']
                print(f"用户认证成功: {user.username}")

                # 登录用户，设置session
                login(request, user)

                # 生成 JWT token
                token = JWTManager.generate_token(user)
                print("Token 生成成功")

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
                print("序列化验证失败:", serializer.errors)
                return Response({
                    'success': False,
                    'message': '登录失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("登录过程异常:", str(e))
            import traceback
            print("详细错误:", traceback.format_exc())

            return Response({
                'success': False,
                'message': '登录过程中服务器错误',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLoginView(LoginView):
    """管理员专用登录视图，只允许管理员用户登录"""

    def post(self, request):
        print("=== 收到管理员登录请求 ===")
        print("请求数据:", request.data)

        try:
            serializer = UserLoginSerializer(data=request.data)
            print("序列化器创建完成")

            if serializer.is_valid():
                print("序列化验证通过")
                user = serializer.validated_data['user']
                print(f"用户认证成功: {user.username}")

                # 检查用户是否为管理员
                if not (user.groups.filter(name='admin').exists() or user.is_superuser):
                    print(f"用户 {user.username} 不是管理员，拒绝登录")
                    return Response({
                        'success': False,
                        'message': '只有管理员才能登录此页面'
                    }, status=status.HTTP_403_FORBIDDEN)

                # 登录用户，设置session
                login(request, user)

                # 生成 JWT token
                token = JWTManager.generate_token(user)
                print("Token 生成成功")

                return Response({
                    'success': True,
                    'message': '管理员登录成功',
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser,
                        'groups': [group.name for group in user.groups.all()]
                    }
                }, status=status.HTTP_200_OK)
            else:
                print("序列化验证失败:", serializer.errors)
                return Response({
                    'success': False,
                    'message': '管理员登录失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("管理员登录过程异常:", str(e))
            import traceback
            print("详细错误:", traceback.format_exc())

            return Response({
                'success': False,
                'message': '管理员登录过程中服务器错误',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            serializer = UserProfileSerializer(user)

            return Response({
                'success': True,
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': '获取用户信息失败',
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