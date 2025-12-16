from django.db.models import F
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta, datetime
import logging
from rest_framework import generics, permissions, status, exceptions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from auth_api.utils import JWTManager
from .models import ForumSection, ForumPost, ForumReply, PostLike, ReplyLike, UserFollow, Notification
from .serializers import (
    ForumSectionSerializer,
    ForumPostListSerializer,
    ForumPostDetailSerializer,
    ForumPostCreateSerializer,
    ForumReplySerializer,
    UserFollowSerializer,
    NotificationSerializer,
)


def increment_post_views(request, post_instance: ForumPost):
    """增加帖子浏览量，带防重复机制（5秒内同一帖子只增加一次）"""
    # 确保session可用
    if not hasattr(request, 'session'):
        # 如果session不可用，直接增加浏览量（至少不会报错）
        ForumPost.objects.filter(pk=post_instance.pk).update(views=F("views") + 1)
        return
    
    session_key = f'viewed_post_{post_instance.pk}'
    last_viewed_time_str = request.session.get(session_key)
    now = timezone.now()
    
    should_increment = True
    if last_viewed_time_str:
        try:
            # 尝试解析时间字符串
            if isinstance(last_viewed_time_str, str):
                # 处理ISO格式的时间字符串
                time_str = last_viewed_time_str.replace('Z', '+00:00')
                last_viewed_time = datetime.fromisoformat(time_str)
                if timezone.is_naive(last_viewed_time):
                    last_viewed_time = timezone.make_aware(last_viewed_time)
                time_diff = (now - last_viewed_time).total_seconds()
                if time_diff <= 5:
                    should_increment = False
        except (ValueError, TypeError, AttributeError):
            pass 
    
    if should_increment:
        ForumPost.objects.filter(pk=post_instance.pk).update(views=F("views") + 1)
        request.session[session_key] = now.isoformat()
        request.session.modified = True  # 确保session被保存


class ForumSectionListView(generics.ListAPIView):
    queryset = ForumSection.objects.all().order_by("order", "id")
    serializer_class = ForumSectionSerializer
    permission_classes = [permissions.AllowAny]


@method_decorator(csrf_exempt, name="dispatch")
class ForumPostCreateView(generics.CreateAPIView):
    """创建新帖子，要求登录（在此视图内通过 JWT 检查）。"""

    queryset = ForumPost.objects.all()
    serializer_class = ForumPostCreateSerializer
    # 在视图内部手动检查 JWT
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):  # type: ignore[override]
        request = self.request
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.PermissionDenied("未提供认证token")

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
        except Exception as e:  # noqa: BLE001
            raise exceptions.PermissionDenied(str(e))

        post = serializer.save(author=user)
        
        # 发送通知给关注者
        try:
            followers = UserFollow.objects.filter(following=user).select_related('follower')
            if followers.exists():
                notifications = []
                for follow in followers:
                    notifications.append(
                        Notification(
                            recipient=follow.follower,
                            notification_type='new_post',
                            title=f"{user.username} 发布了新帖",
                            content=f"{user.username} 发布了新帖：{post.title}",
                            related_post=post
                        )
                    )
                
                # 批量创建通知
                if notifications:
                    Notification.objects.bulk_create(notifications)
                    logger = logging.getLogger(__name__)
                    logger.info(f"成功为帖子 {post.id} 创建了 {len(notifications)} 条通知")
        except Exception as e:  # noqa: BLE001
            logger = logging.getLogger(__name__)
            logger.error(f"为帖子 {post.id} 创建通知时出错: {str(e)}", exc_info=True)
        
        return post


@method_decorator(csrf_exempt, name="dispatch")
class ForumPostUpdateView(generics.UpdateAPIView):
    """更新帖子，要求登录且是作者。"""

    queryset = ForumPost.objects.all()
    serializer_class = ForumPostCreateSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'

    def get_object(self):
        """获取要更新的帖子对象"""
        pk = self.kwargs.get('pk')
        try:
            return ForumPost.objects.get(pk=pk)
        except ForumPost.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("帖子不存在")

    def update(self, request, *args, **kwargs):  # type: ignore[override]
        """更新帖子"""
        instance = self.get_object()
        
        # 检查认证
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.PermissionDenied("未提供认证token")

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
        except Exception as e:  # noqa: BLE001
            raise exceptions.PermissionDenied(str(e))

        # 检查是否是作者
        if instance.author != user:
            raise exceptions.PermissionDenied("您没有权限编辑此帖子")

        # 更新帖子
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


class ForumPostDetailView(generics.RetrieveAPIView):
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'

    def retrieve(self, request, *args, **kwargs):  # type: ignore[override]
        instance: ForumPost = self.get_object()
        # 浏览量自增
        increment_post_views(request, instance)
        instance.refresh_from_db(fields=["views"])
        serializer = self.get_serializer(instance, context={"request": request})
        return Response(serializer.data)


class ForumPostDetailByTitleView(generics.RetrieveAPIView):
    """根据标题查询帖子详情（用于前端路由 /forum/post/:title）"""
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'title'

    def get_object(self):  # type: ignore[override]
        title = self.kwargs.get('title')
        if not title:
            from rest_framework.exceptions import NotFound
            raise NotFound("帖子标题不能为空")
        
        # URL decode title
        from urllib.parse import unquote
        decoded_title = unquote(title)
        
        try:
            instance = ForumPost.objects.get(title=decoded_title)
        except ForumPost.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("帖子不存在")
        except ForumPost.MultipleObjectsReturned:
            # 如果标题重复，返回最新的一个
            instance = ForumPost.objects.filter(title=decoded_title).order_by('-created_at').first()
        
        return instance

    def retrieve(self, request, *args, **kwargs):  # type: ignore[override]
        instance: ForumPost = self.get_object()
        # 浏览量自增
        increment_post_views(request, instance)
        instance.refresh_from_db(fields=["views"])
        serializer = self.get_serializer(instance, context={"request": request})
        return Response(serializer.data)


class ForumPostListView(generics.ListAPIView):
    """通用帖子列表，可按板块、标签、排序方式筛选。"""

    serializer_class = ForumPostListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):  # type: ignore[override]
        queryset = ForumPost.objects.all()

        section = self.request.query_params.get("section")
        if section:
            queryset = queryset.filter(section__name=section)

        topic = self.request.query_params.get("topic")
        if topic:
            queryset = queryset.filter(tags__contains=[topic])

        sort = self.request.query_params.get("sort", "latest")
        if sort == "hot":
            queryset = queryset.order_by("-views", "-replies_count", "-likes")
        else:
            queryset = queryset.order_by("-created_at")

        return queryset


class ForumPostLatestView(ForumPostListView):
    """最新帖子列表，简单复用通用视图，只固定排序。"""

    def get_queryset(self):  # type: ignore[override]
        queryset = ForumPost.objects.all().order_by("-created_at")
        return queryset


class ForumPostHotView(ForumPostListView):
    """热门帖子列表，只显示标记为热门的帖子，按浏览量/回复排序。"""

    def get_queryset(self):  # type: ignore[override]
        # 只返回标记为热门的帖子
        queryset = ForumPost.objects.filter(is_hot=True).order_by("-views", "-replies_count", "-likes")
        return queryset


@method_decorator(csrf_exempt, name="dispatch")
class ForumReplyCreateView(generics.CreateAPIView):
    """对某个帖子发表评论，要求登录（在此视图内通过 JWT 检查）。"""

    serializer_class = ForumReplySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):  # type: ignore[override]
        return ForumReply.objects.all()

    def perform_create(self, serializer):  # type: ignore[override]
        request = self.request
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.PermissionDenied("未提供认证token")

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
        except Exception as e:  # noqa: BLE001
            raise exceptions.PermissionDenied(str(e))

        post_id = self.kwargs.get("post_id")
        post = generics.get_object_or_404(ForumPost, pk=post_id)
        
        # 获取parent参数
        parent_id = request.data.get("parent_id")
        parent = None
        if parent_id:
            try:
                parent = ForumReply.objects.get(pk=parent_id, post=post)
            except ForumReply.DoesNotExist:
                raise exceptions.ValidationError("父回复不存在或不属于该帖子")
        
        reply = serializer.save(author=user, post=post, parent=parent)
        
        # 增加帖子的回复数
        if not parent:
            ForumPost.objects.filter(pk=post.pk).update(replies_count=F("replies_count") + 1)
        
        # 发送回复通知
        try:
            notifications = []
            
            if parent:
                if parent.author != user:
                    notifications.append(
                        Notification(
                            recipient=parent.author,
                            notification_type='reply',
                            title=f"{user.username} 回复了您的评论",
                            content=f"{user.username} 在帖子《{post.title}》中回复了您的评论",
                            related_post=post,
                            related_reply=reply
                        )
                    )
            else:
                if post.author != user:
                    notifications.append(
                        Notification(
                            recipient=post.author,
                            notification_type='reply',
                            title=f"{user.username} 回复了您的帖子",
                            content=f"{user.username} 回复了您的帖子：{post.title}",
                            related_post=post,
                            related_reply=reply
                        )
                    )
            
            # 批量创建通知
            if notifications:
                Notification.objects.bulk_create(notifications)
                logger = logging.getLogger(__name__)
                logger.info(f"成功为回复 {reply.id} 创建了 {len(notifications)} 条通知")
        except Exception as e:  # noqa: BLE001
            # 通知创建失败不影响回复创建
            logger = logging.getLogger(__name__)
            logger.error(f"为回复 {reply.id} 创建通知时出错: {str(e)}", exc_info=True)
        
        return reply

@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def toggle_post_like(request, post_id: int):
    """帖子点赞/取消点赞接口，记录用户-帖子点赞关系。"""

    # 验证JWT token并获取用户
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return Response(
            {"detail": "未提供认证token"},
            status=status.HTTP_403_FORBIDDEN
        )

    token = auth_header.split(" ")[1]
    try:
        user = JWTManager.get_user_from_token(token)
    except Exception as e:  # noqa: BLE001
        return Response(
            {"detail": f"认证失败: {str(e)}"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        post = ForumPost.objects.get(pk=post_id)
    except ForumPost.DoesNotExist:
        return Response(
            {"detail": "帖子不存在"},
            status=status.HTTP_404_NOT_FOUND
        )

    action = request.data.get("action", "toggle")

    # 检查是否已点赞
    try:
        like_record = PostLike.objects.get(post=post, user=user)
        already_liked = True
    except PostLike.DoesNotExist:
        like_record = None
        already_liked = False

    try:
        if action == "like":
            # 如果未点赞，创建点赞记录并增加计数
            if not already_liked:
                PostLike.objects.create(post=post, user=user)
                ForumPost.objects.filter(pk=post.pk).update(likes=F("likes") + 1)
            is_liked = True
        elif action == "unlike":
            # 如果已点赞，删除点赞记录并减少计数
            if already_liked and like_record:
                like_record.delete()
                ForumPost.objects.filter(pk=post.pk, likes__gt=0).update(likes=F("likes") - 1)
            is_liked = False
        else:  # toggle
            # 如果已点赞，则取消点赞；否则点赞
            if already_liked and like_record:
                like_record.delete()
                ForumPost.objects.filter(pk=post.pk, likes__gt=0).update(likes=F("likes") - 1)
                is_liked = False
            else:
                PostLike.objects.create(post=post, user=user)
                ForumPost.objects.filter(pk=post.pk).update(likes=F("likes") + 1)
                is_liked = True

        # 刷新帖子数据
        post.refresh_from_db(fields=["likes"])
        
        # 确保likes字段和PostLike记录数量同步（防止数据不一致）
        actual_likes_count = PostLike.objects.filter(post=post).count()
        if post.likes != actual_likes_count:
            ForumPost.objects.filter(pk=post.pk).update(likes=actual_likes_count)
            post.refresh_from_db(fields=["likes"])
        
        return Response({
            "id": post.id,
            "likes": post.likes,
            "is_liked": is_liked
        }, status=status.HTTP_200_OK)
    except Exception as e:  # noqa: BLE001
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"点赞操作失败: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"detail": f"操作失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def toggle_reply_like(request, reply_id: int):
    """回复点赞/取消点赞接口，记录用户-回复点赞关系。"""

    # 验证JWT token并获取用户
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return Response(
            {"detail": "未提供认证token"},
            status=status.HTTP_403_FORBIDDEN
        )

    token = auth_header.split(" ")[1]
    try:
        user = JWTManager.get_user_from_token(token)
    except Exception as e:  # noqa: BLE001
        return Response(
            {"detail": f"认证失败: {str(e)}"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        reply = ForumReply.objects.get(pk=reply_id)
    except ForumReply.DoesNotExist:
        return Response(
            {"detail": "回复不存在"},
            status=status.HTTP_404_NOT_FOUND
        )

    action = request.data.get("action", "toggle")

    # 检查是否已点赞
    try:
        like_record = ReplyLike.objects.get(reply=reply, user=user)
        already_liked = True
    except ReplyLike.DoesNotExist:
        like_record = None
        already_liked = False

    try:
        if action == "like":
            # 如果未点赞，创建点赞记录并增加计数
            if not already_liked:
                ReplyLike.objects.create(reply=reply, user=user)
                ForumReply.objects.filter(pk=reply.pk).update(likes=F("likes") + 1)
            is_liked = True
        elif action == "unlike":
            # 如果已点赞，删除点赞记录并减少计数
            if already_liked and like_record:
                like_record.delete()
                ForumReply.objects.filter(pk=reply.pk, likes__gt=0).update(likes=F("likes") - 1)
            is_liked = False
        else:  # toggle
            # 如果已点赞，则取消点赞；否则点赞
            if already_liked and like_record:
                like_record.delete()
                ForumReply.objects.filter(pk=reply.pk, likes__gt=0).update(likes=F("likes") - 1)
                is_liked = False
            else:
                ReplyLike.objects.create(reply=reply, user=user)
                ForumReply.objects.filter(pk=reply.pk).update(likes=F("likes") + 1)
                is_liked = True

        # 刷新回复数据
        reply.refresh_from_db(fields=["likes"])
        
        actual_likes_count = ReplyLike.objects.filter(reply=reply).count()
        if reply.likes != actual_likes_count:
            ForumReply.objects.filter(pk=reply.pk).update(likes=actual_likes_count)
            reply.refresh_from_db(fields=["likes"])
        
        return Response({
            "id": reply.id,
            "likes": reply.likes,
            "is_liked": is_liked
        }, status=status.HTTP_200_OK)
    except Exception as e:  # noqa: BLE001
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"回复点赞操作失败: {str(e)}\n{traceback.format_exc()}")
        return Response(
            {"detail": f"操作失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 关注/取消关注用户
@method_decorator(csrf_exempt, name="dispatch")
class UserFollowView(generics.CreateAPIView, generics.DestroyAPIView):
    """关注/取消关注用户"""
    serializer_class = UserFollowSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return UserFollow.objects.all()

    def create(self, request, *args, **kwargs):  # type: ignore[override]
        """重写create方法，手动处理关注逻辑"""
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.PermissionDenied("未提供认证token")

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
        except Exception as e:  # noqa: BLE001
            raise exceptions.PermissionDenied(str(e))

        following_id = request.data.get("following_id")
        if not following_id:
            raise exceptions.ValidationError("缺少following_id参数")

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            following_user = User.objects.get(id=following_id)
        except User.DoesNotExist:
            raise exceptions.NotFound("用户不存在")

        if user == following_user:
            raise exceptions.ValidationError("不能关注自己")

        # 检查是否已经关注
        if UserFollow.objects.filter(follower=user, following=following_user).exists():
            raise exceptions.ValidationError("已经关注过该用户")

        # 创建关注关系
        follow = UserFollow.objects.create(follower=user, following=following_user)
        serializer = self.get_serializer(follow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, *args, **kwargs):  # type: ignore[override]
        """取消关注"""
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.PermissionDenied("未提供认证token")

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
        except Exception as e:  # noqa: BLE001
            raise exceptions.PermissionDenied(str(e))

        following_id = request.data.get("following_id")
        if not following_id:
            raise exceptions.ValidationError("缺少following_id参数")

        try:
            follow = UserFollow.objects.get(follower=user, following_id=following_id)
            follow.delete()
            return Response({"message": "取消关注成功"}, status=status.HTTP_200_OK)
        except UserFollow.DoesNotExist:
            raise exceptions.NotFound("未找到关注关系")


# 检查是否关注
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_follow_status(request, user_id):
    """检查当前用户是否关注了指定用户"""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return Response({"is_following": False})

    token = auth_header.split(" ")[1]
    try:
        user = JWTManager.get_user_from_token(token)
        is_following = UserFollow.objects.filter(
            follower=user,
            following_id=user_id
        ).exists()
        return Response({"is_following": is_following})
    except Exception:  # noqa: BLE001
        return Response({"is_following": False})


# 获取通知列表
@method_decorator(csrf_exempt, name="dispatch")
class NotificationListView(generics.ListAPIView):
    """获取通知列表"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        auth_header = self.request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return Notification.objects.none()

        token = auth_header.split(" ")[1]
        try:
            user = JWTManager.get_user_from_token(token)
            return Notification.objects.filter(recipient=user)
        except Exception:  # noqa: BLE001
            return Notification.objects.none()


# 获取未读通知数量
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_unread_notification_count(request):
    """获取未读通知数量"""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return Response({"count": 0})

    token = auth_header.split(" ")[1]
    try:
        user = JWTManager.get_user_from_token(token)
        count = Notification.objects.filter(recipient=user, is_read=False).count()
        return Response({"count": count})
    except Exception:  # noqa: BLE001
        return Response({"count": 0})


# 标记通知为已读
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mark_notification_read(request, notification_id):
    """标记通知为已读"""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        raise exceptions.PermissionDenied("未提供认证token")

    token = auth_header.split(" ")[1]
    try:
        user = JWTManager.get_user_from_token(token)
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification.is_read = True
        notification.save()
        return Response({"message": "标记成功"})
    except Notification.DoesNotExist:
        raise exceptions.NotFound("通知不存在")
    except Exception as e:  # noqa: BLE001
        raise exceptions.PermissionDenied(str(e))
