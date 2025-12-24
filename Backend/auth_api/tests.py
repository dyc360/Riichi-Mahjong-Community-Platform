from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework import status
from django.urls import reverse
from unittest.mock import patch, MagicMock
from .utils import JWTManager

User = get_user_model()


class AuthAPITestCase(TestCase):
    """认证API测试用例"""

    def setUp(self):
        """测试前准备"""
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('profile')
        self.logout_url = reverse('logout')
        self.user_list_url = reverse('user-list')
        
        # 创建测试用户
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_register_success(self):
        """测试用户注册成功"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')
        self.assertEqual(response.data['user']['email'], 'newuser@example.com')

    def test_register_password_mismatch(self):
        """测试密码不匹配的注册"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'differentpass'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_register_duplicate_username(self):
        """测试重复用户名注册"""
        data = {
            'username': 'testuser',  # 已存在的用户名
            'email': 'another@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_register_duplicate_email(self):
        """测试重复邮箱注册"""
        data = {
            'username': 'anotheruser',
            'email': 'test@example.com',  # 已存在的邮箱
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_register_short_password(self):
        """测试密码过短"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': '12345',  # 少于6位
            'password_confirm': '12345'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """测试登录成功"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_login_wrong_password(self):
        """测试错误密码登录"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_nonexistent_user(self):
        """测试不存在的用户登录"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_missing_fields(self):
        """测试缺少必填字段的登录"""
        data = {
            'email': 'test@example.com'
            # 缺少 password
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_profile_without_auth(self):
        """测试未认证时获取用户信息"""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_logout_without_auth(self):
        """测试未认证时退出登录"""
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_user_list_without_auth(self):
        """测试未认证时获取用户列表"""
        response = self.client.get(self.user_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_jwt_token_generation(self):
        """测试JWT token生成"""
        token = JWTManager.generate_token(self.test_user)
        self.assertIsNotNone(token)
        self.assertIsInstance(token, str)

    def test_jwt_token_verification(self):
        """测试JWT token验证"""
        token = JWTManager.generate_token(self.test_user)
        payload = JWTManager.verify_token(token)
        
        self.assertIsNotNone(payload)
        self.assertEqual(payload['user_id'], self.test_user.id)
        self.assertEqual(payload['username'], self.test_user.username)

    def test_jwt_get_user_from_token(self):
        """测试从token获取用户"""
        token = JWTManager.generate_token(self.test_user)
        user = JWTManager.get_user_from_token(token)
        
        self.assertEqual(user.id, self.test_user.id)
        self.assertEqual(user.username, self.test_user.username)

    def test_invalid_token(self):
        """测试无效token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_manager_create_user_missing_username(self):
        """测试创建用户时缺少用户名"""
        from auth_api.models import CustomUser
        with self.assertRaises(ValueError):
            CustomUser.objects.create_user(
                username='',
                email='test@example.com',
                password='testpass123'
            )

    def test_user_manager_create_user_missing_email(self):
        """测试创建用户时缺少邮箱"""
        from auth_api.models import CustomUser
        with self.assertRaises(ValueError):
            CustomUser.objects.create_user(
                username='testuser',
                email='',
                password='testpass123'
            )

    def test_user_manager_create_superuser(self):
        """测试创建超级用户"""
        from auth_api.models import CustomUser
        superuser = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_has_perm(self):
        """测试用户权限检查"""
        # 普通用户
        self.assertFalse(self.test_user.has_perm('some.perm'))
        
        # 超级用户
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.assertTrue(superuser.has_perm('some.perm'))

    def test_user_has_module_perms(self):
        """测试用户模块权限检查"""
        # 普通用户
        self.assertFalse(self.test_user.has_module_perms('some_app'))
        
        # 超级用户
        superuser = User.objects.create_superuser(
            username='admin2',
            email='admin2@example.com',
            password='admin123'
        )
        self.assertTrue(superuser.has_module_perms('some_app'))

    def test_jwt_verify_expired_token(self):
        """测试验证过期的token"""
        import jwt
        from datetime import datetime, timedelta
        from django.conf import settings
        
        # 创建一个已过期的 token
        payload = {
            'user_id': self.test_user.id,
            'username': self.test_user.username,
            'email': self.test_user.email,
            'exp': datetime.utcnow() - timedelta(days=1),  # 已过期
            'iat': datetime.utcnow() - timedelta(days=2)
        }
        expired_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        with self.assertRaises(Exception) as context:
            JWTManager.verify_token(expired_token)
        self.assertIn('过期', str(context.exception))

    def test_jwt_verify_invalid_token(self):
        """测试验证无效的token"""
        with self.assertRaises(Exception) as context:
            JWTManager.verify_token('invalid.token.here')
        self.assertIn('无效', str(context.exception))

    def test_jwt_get_user_from_token_nonexistent_user(self):
        """测试从token获取不存在的用户"""
        import jwt
        from datetime import datetime, timedelta
        from django.conf import settings
        
        # 创建一个包含不存在用户ID的 token
        payload = {
            'user_id': 99999,  # 不存在的用户ID
            'username': 'nonexistent',
            'email': 'nonexistent@example.com',
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        with self.assertRaises(Exception) as context:
            JWTManager.get_user_from_token(token)
        self.assertIn('不存在', str(context.exception))

    def test_middleware_excluded_paths(self):
        """测试中间件排除的路径"""
        from auth_api.middleware import JWTAuthentication
        from django.test import RequestFactory
        from django.http import HttpResponse
        
        def mock_get_response(request):
            return HttpResponse("OK")
        
        factory = RequestFactory()
        middleware = JWTAuthentication(mock_get_response)
        
        # 测试排除的路径
        excluded_paths = [
            '/api/auth/register/',
            '/api/auth/login/',
            '/api/m-league/',
            '/api/news_api/',
            '/admin/',
            '/health/',
            '/'
        ]
        
        for path in excluded_paths:
            request = factory.get(path)
            # 不应该抛出异常，应该正常通过
            response = middleware(request)
            # 应该返回响应（不是 None）
            self.assertIsNotNone(response)
            # 对于排除的路径，应该返回正常响应
            if hasattr(response, 'status_code'):
                self.assertNotEqual(response.status_code, 401)



    def test_home_view(self):
        """测试首页视图"""
        from django.urls import reverse
        url = reverse('home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertIn('endpoints', response.json())

    def test_health_check_view(self):
        """测试健康检查视图"""
        from django.urls import reverse
        url = reverse('health-check')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertIn('timestamp', response.data)

    def test_register_exception_handling(self):
        """测试注册时的异常处理"""
        # Mock serializer.save() 抛出异常
        from unittest.mock import patch, MagicMock
        with patch('auth_api.views.UserRegistrationSerializer') as mock_serializer_class:
            mock_serializer = MagicMock()
            mock_serializer.is_valid.return_value = True
            mock_serializer.save.side_effect = Exception("数据库错误")
            mock_serializer_class.return_value = mock_serializer
            
            data = {
                'username': 'testuser2',
                'email': 'test2@example.com',
                'password': 'testpass123',
                'password_confirm': 'testpass123'
            }
            response = self.client.post(self.register_url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertFalse(response.data['success'])

    def test_login_exception_handling(self):
        """测试登录时的异常处理"""
        from unittest.mock import patch
        # Mock serializer 抛出异常
        with patch('auth_api.views.UserLoginSerializer') as mock_serializer_class:
            mock_serializer_class.side_effect = Exception("序列化器错误")
            
            data = {
                'email': 'test@example.com',
                'password': 'testpass123'
            }
            response = self.client.post(self.login_url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertFalse(response.data['success'])

    def test_profile_exception_handling(self):
        """测试获取用户信息时的异常处理"""
        # 直接测试视图，模拟序列化器抛出异常
        from auth_api.views import ProfileView
        factory = APIRequestFactory()
        request = factory.get(self.profile_url)
        request.user = self.test_user
        
        with patch('auth_api.views.UserProfileSerializer') as mock_serializer_class:
            mock_serializer = MagicMock()
            # 模拟访问 data 属性时抛出异常
            def raise_exception():
                raise Exception("序列化错误")
            type(mock_serializer).data = property(lambda self: raise_exception())
            mock_serializer_class.return_value = mock_serializer
            
            view = ProfileView()
            response = view.get(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertFalse(response.data['success'])


    def test_user_list_exception_handling(self):
        """测试获取用户列表时的异常处理"""
        from unittest.mock import patch
        token = JWTManager.generate_token(self.test_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Mock CustomUser.objects.all() 抛出异常
        with patch('auth_api.models.CustomUser.objects.all') as mock_all:
            mock_all.side_effect = Exception("数据库查询错误")
            
            # 直接测试视图
            from auth_api.views import UserListView
            from rest_framework.test import APIRequestFactory
            factory = APIRequestFactory()
            request = factory.get(self.user_list_url)
            request.user = self.test_user
            
            view = UserListView()
            response = view.get(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertFalse(response.data['success'])
