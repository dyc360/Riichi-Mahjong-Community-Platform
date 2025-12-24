# auth_api/serializers.py
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
<<<<<<< HEAD
    email = serializers.EmailField(required=False)  # 可选
    username = serializers.CharField(required=False)  # 可选
=======
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
>>>>>>> 89acc2758e42330758878a9ee7c626d39f72358c
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')

        if not email and not username:
            raise serializers.ValidationError('必须提供邮箱或用户名')

        if not password:
            raise serializers.ValidationError('必须提供密码')

        # 通过邮箱或用户名查找用户
        user_obj = None
        if email:
            try:
                user_obj = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('邮箱或密码错误')
        elif username:
            try:
                user_obj = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('用户名或密码错误')

<<<<<<< HEAD
        # 使用用户名进行认证（Django 的 authenticate 需要 username）
=======
        # 使用用户名进行认证
>>>>>>> 89acc2758e42330758878a9ee7c626d39f72358c
        user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError('邮箱/用户名或密码错误')

        if not user.is_active:
            raise serializers.ValidationError('用户账户已被禁用')

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    joinDate = serializers.SerializerMethodField()
    practiceStats = serializers.SerializerMethodField()
    forumStats = serializers.SerializerMethodField()
    avatar = serializers.URLField(read_only=True)  # 去掉 source='avatar'
    isEmailVerified = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'avatar',
            'joinDate', 'practiceStats', 'forumStats',
            'isEmailVerified', 'date_joined', 'last_login'
        )
        read_only_fields = fields

    def get_joinDate(self, obj):
        """获取加入日期"""
        if obj.join_date:
            return obj.join_date.strftime('%Y-%m-%d')
        return obj.date_joined.strftime('%Y-%m-%d')

    def get_practiceStats(self, obj):
        """获取练习统计数据"""
        return {
            'completed': obj.completed_exercises,
            'accuracy': float(obj.average_accuracy),
            'rank': obj.current_rank
        }

    def get_forumStats(self, obj):
        """获取论坛统计数据"""
        return {
            'posts': obj.topics_published,
            'replies': obj.replies_count,
            'likes': obj.likes_received
        }

    def get_isEmailVerified(self, obj):
        """获取邮箱验证状态"""
        return True


class UserStatsSerializer(serializers.Serializer):
    """用于更新用户统计数据的序列化器"""
    practiceStats = serializers.DictField(required=False)
    forumStats = serializers.DictField(required=False)


class UserUpdateSerializer(serializers.ModelSerializer):
    """用于更新用户基础信息的序列化器"""

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'avatar')
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'avatar': {'required': False}
        }