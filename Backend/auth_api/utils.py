import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class JWTManager:
    @staticmethod
    def generate_token(user):
        payload = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'exp': datetime.utcnow() + settings.JWT_EXPIRATION_DELTA,
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return token

    @staticmethod
    def verify_token(token):
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception('Token已过期')
        except jwt.InvalidTokenError:
            raise Exception('无效的Token')

    @staticmethod
    def get_user_from_token(token):
        payload = JWTManager.verify_token(token)
        user_id = payload.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            return user
        except User.DoesNotExist:
            raise Exception('用户不存在')