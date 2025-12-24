from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ForumSection(models.Model):
    """论坛板块，如技术交流、赛事讨论等。"""

    name = models.SlugField(max_length=50, unique=True, verbose_name="内部标识")
    title = models.CharField(max_length=100, verbose_name="板块名称")
    description = models.TextField(blank=True, verbose_name="板块描述")
    icon = models.URLField(blank=True, verbose_name="图标URL")
    order = models.PositiveIntegerField(default=0, verbose_name="排序")

    class Meta:
        verbose_name = "论坛板块"
        verbose_name_plural = verbose_name
        ordering = ["order", "id"]

    def __str__(self) -> str:  # type: ignore[override]
        return self.title


class ForumPost(models.Model):
    """论坛帖子。"""

    section = models.ForeignKey(
        ForumSection,
        related_name="posts",
        on_delete=models.CASCADE,
        verbose_name="所属板块",
    )
    author = models.ForeignKey(
        User,
        related_name="forum_posts",
        on_delete=models.CASCADE,
        verbose_name="作者",
    )
    title = models.CharField(max_length=200, verbose_name="标题")
    content = models.TextField(verbose_name="内容")
    # 使用JSON字段存储标签列表，方便前端传入字符串数组
    tags = models.JSONField(default=list, blank=True, verbose_name="标签列表")

    views = models.PositiveIntegerField(default=0, verbose_name="浏览量")
    replies_count = models.PositiveIntegerField(default=0, verbose_name="回复数")
    likes = models.PositiveIntegerField(default=0, verbose_name="点赞数")
    is_hot = models.BooleanField(default=False, verbose_name="是否热门")
<<<<<<< HEAD
    is_deleted = models.BooleanField(default=False, verbose_name="是否已删除")
=======
>>>>>>> 89acc2758e42330758878a9ee7c626d39f72358c

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "论坛帖子"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return self.title


class ForumReply(models.Model):
    """帖子回复。支持楼中楼结构（嵌套回复）。"""

    post = models.ForeignKey(
        ForumPost,
        related_name="replies",
        on_delete=models.CASCADE,
        verbose_name="所属帖子",
    )
    author = models.ForeignKey(
        User,
        related_name="forum_replies",
        on_delete=models.CASCADE,
        verbose_name="作者",
    )
    parent = models.ForeignKey(
        "self",
        related_name="children",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="父回复",
        help_text="如果是对回复的回复，则指向父回复；如果是对帖子的直接回复，则为空",
    )
    content = models.TextField(verbose_name="回复内容")
    likes = models.PositiveIntegerField(default=0, verbose_name="点赞数")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "帖子回复"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return f"回复 {self.post_id} by {self.author_id}"


class PostLike(models.Model):
    """帖子点赞记录，记录用户和帖子的点赞关系。"""

    post = models.ForeignKey(
        ForumPost,
        related_name="likes_records",
        on_delete=models.CASCADE,
        verbose_name="帖子",
    )
    user = models.ForeignKey(
        User,
        related_name="post_likes",
        on_delete=models.CASCADE,
        verbose_name="用户",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="点赞时间")

    class Meta:
        verbose_name = "帖子点赞"
        verbose_name_plural = verbose_name
        # 确保同一用户对同一帖子只能点赞一次
        unique_together = [["post", "user"]]
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return f"{self.user.username} 点赞了 {self.post.title}"


class ReplyLike(models.Model):
    """回复点赞记录，记录用户和回复的点赞关系。"""

    reply = models.ForeignKey(
        ForumReply,
        related_name="likes_records",
        on_delete=models.CASCADE,
        verbose_name="回复",
    )
    user = models.ForeignKey(
        User,
        related_name="reply_likes",
        on_delete=models.CASCADE,
        verbose_name="用户",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="点赞时间")

    class Meta:
        verbose_name = "回复点赞"
        verbose_name_plural = verbose_name
        # 确保同一用户对同一回复只能点赞一次
        unique_together = [["reply", "user"]]
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return f"{self.user.username} 点赞了回复 {self.reply_id}"


class UserFollow(models.Model):
    """用户关注关系"""
    follower = models.ForeignKey(
        User,
        related_name="following",
        on_delete=models.CASCADE,
        verbose_name="关注者"
    )
    following = models.ForeignKey(
        User,
        related_name="followers",
        on_delete=models.CASCADE,
        verbose_name="被关注者"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="关注时间")

    class Meta:
        verbose_name = "用户关注"
        verbose_name_plural = verbose_name
        unique_together = [["follower", "following"]]
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return f"{self.follower.username} 关注了 {self.following.username}"


class Notification(models.Model):
    """通知"""
    NOTIFICATION_TYPES = [
        ('new_post', '新帖通知'),
        ('reply', '回复通知'),
        ('like', '点赞通知'),
    ]

    recipient = models.ForeignKey(
        User,
        related_name="notifications",
        on_delete=models.CASCADE,
        verbose_name="接收者"
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        verbose_name="通知类型"
    )
    title = models.CharField(max_length=200, verbose_name="通知标题")
    content = models.TextField(verbose_name="通知内容")
    related_post = models.ForeignKey(
        ForumPost,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="相关帖子"
    )
    related_reply = models.ForeignKey(
        ForumReply,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="相关回复"
    )
    is_read = models.BooleanField(default=False, verbose_name="是否已读")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "通知"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self) -> str:  # type: ignore[override]
        return f"{self.recipient.username} - {self.title}"
