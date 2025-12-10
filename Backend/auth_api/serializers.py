from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "密码不匹配"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)  # 改为必填字段
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email:
            raise serializers.ValidationError('必须提供邮箱')

        if not password:
            raise serializers.ValidationError('必须提供密码')

        # 通过邮箱查找用户
        try:
            user_obj = CustomUser.objects.get(email=email)
            # 使用用户名进行认证（Django 的 authenticate 需要 username）
            user = authenticate(username=user_obj.username, password=password)

            if not user:
                raise serializers.ValidationError('邮箱或密码错误')

            if not user.is_active:
                raise serializers.ValidationError('用户账户已被禁用')

            attrs['user'] = user
            return attrs

        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('邮箱或密码错误')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'date_joined', 'last_login')