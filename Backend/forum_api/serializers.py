from rest_framework import serializers

from .models import ForumSection, ForumPost, ForumReply, ReplyLike


class ForumSectionSerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = ForumSection
        fields = [
            "id",
            "name",
            "title",
            "description",
            "icon",
            "order",
            "post_count",
        ]


class ForumReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    post = serializers.PrimaryKeyRelatedField(read_only=True)  # post 由后端从 URL 参数设置，前端不需要传
    parent = serializers.PrimaryKeyRelatedField(
        queryset=ForumReply.objects.all(), required=False, allow_null=True
    )
    parent_author_name = serializers.CharField(source="parent.author.username", read_only=True)
    is_liked = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()  # 嵌套回复

    class Meta:
        model = ForumReply
        fields = [
            "id",
            "post",
            "parent",
            "parent_author_name",
            "author_name",
            "content",
            "likes",
            "is_liked",
            "created_at",
            "children",
        ]
        read_only_fields = ["id", "post", "likes", "created_at"]

    def get_is_liked(self, obj):
        """根据当前请求的用户判断是否已点赞"""
        request = self.context.get("request")
        if not request:
            return False
        
        user = None
        
        # 首先尝试从JWT token获取用户（最可靠的方式）
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            try:
                from auth_api.utils import JWTManager
                token = auth_header.split(" ")[1]
                if token:  # 确保token不为空
                    user = JWTManager.get_user_from_token(token)
            except Exception as e:
                # Token无效，尝试从request.user获取
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"从token获取用户失败: {str(e)}")
                pass
        
        # 如果从token获取失败，尝试从request.user获取（由JWT middleware设置）
        if not user and hasattr(request, "user"):
            request_user = request.user
            # 检查是否是已认证的用户（不是AnonymousUser）
            if hasattr(request_user, "is_authenticated") and request_user.is_authenticated:
                # 检查是否有id属性（确认是真实用户对象）
                if hasattr(request_user, "id") and request_user.id:
                    user = request_user
        
        # 如果没有找到有效用户，返回False
        if not user:
            return False
        
        # 检查是否存在点赞记录
        return ReplyLike.objects.filter(reply=obj, user=user).exists()

    def get_children(self, obj):
        """获取嵌套回复（只返回直接子回复，不递归）"""
        children = obj.children.all().order_by("created_at")
        return ForumReplySerializer(children, many=True, context=self.context).data


class ForumPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)

    class Meta:
        model = ForumPost
        fields = [
            "id",
            "title",
            "author_name",
            "section_name",
            "views",
            "replies_count",
            "likes",
            "is_hot",
            "tags",
            "created_at",
        ]


class ForumPostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    replies = serializers.SerializerMethodField()  # 只返回顶级回复（parent为None）
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = ForumPost
        fields = [
            "id",
            "title",
            "content",
            "author_name",
            "section_name",
            "tags",
            "views",
            "replies_count",
            "likes",
            "is_hot",
            "is_liked",
            "created_at",
            "updated_at",
            "replies",
        ]
        read_only_fields = [
            "id",
            "views",
            "replies_count",
            "likes",
            "is_hot",
            "created_at",
            "updated_at",
        ]

    def get_is_liked(self, obj):
        """根据当前请求的用户判断是否已点赞"""
        request = self.context.get("request")
        if not request:
            return False
        
        user = None
        
        # 首先尝试从JWT token获取用户（最可靠的方式）
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            try:
                from auth_api.utils import JWTManager
                token = auth_header.split(" ")[1]
                if token:  # 确保token不为空
                    user = JWTManager.get_user_from_token(token)
            except Exception as e:
                # Token无效，尝试从request.user获取
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"从token获取用户失败: {str(e)}")
                pass
        
        # 如果从token获取失败，尝试从request.user获取（由JWT middleware设置）
        if not user and hasattr(request, "user"):
            request_user = request.user
            # 检查是否是已认证的用户（不是AnonymousUser）
            if hasattr(request_user, "is_authenticated") and request_user.is_authenticated:
                # 检查是否有id属性（确认是真实用户对象）
                if hasattr(request_user, "id") and request_user.id:
                    user = request_user
        
        # 如果没有找到有效用户，返回False
        if not user:
            return False
        
        # 检查是否存在点赞记录
        from .models import PostLike
        return PostLike.objects.filter(post=obj, user=user).exists()

    def get_replies(self, obj):
        """只返回顶级回复（parent为None），嵌套回复通过children字段返回"""
        top_level_replies = obj.replies.filter(parent__isnull=True).order_by("-created_at")
        return ForumReplySerializer(top_level_replies, many=True, context=self.context).data


class ForumPostCreateSerializer(serializers.ModelSerializer):
    """用于创建帖子的序列化器，前端只需传入板块、标题、内容和标签。"""

    section_id = serializers.PrimaryKeyRelatedField(
        source="section", queryset=ForumSection.objects.all(), write_only=True
    )

    class Meta:
        model = ForumPost
        fields = ["id", "section_id", "title", "content", "tags"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return super().create(validated_data)
