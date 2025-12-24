from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if not email:
            raise ValueError('The Email field must be set')

        email = self.normalize_email(email)

        # 设置默认值
        defaults = {
            'avatar': 'https://placehold.co/100x100/6366f1/ffffff?text=User',
            'completed_exercises': 0,
            'average_accuracy': 0.00,
            'current_rank': '一段',
            'topics_published': 0,
            'replies_count': 0,
            'likes_received': 0,
        }

        # 合并默认值和额外字段
        defaults.update(extra_fields)

        user = self.model(username=username, email=email, **defaults)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(username, email, password, **extra_fields)


<<<<<<< HEAD
class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
=======
class CustomUser(AbstractBaseUser):
    # 基础用户信息（对应前端）
    username = models.CharField(max_length=150, unique=True, verbose_name="用户名")
    email = models.EmailField(unique=True, verbose_name="邮箱")

    # 用户状态与权限
    is_active = models.BooleanField(default=True, verbose_name="是否激活")
    is_staff = models.BooleanField(default=False, verbose_name="是否员工")
    is_superuser = models.BooleanField(default=False, verbose_name="是否超级用户")
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="注册时间")

    # 头像字段（新增）
    avatar = models.URLField(
        max_length=500,
        blank=True,
        default='https://placehold.co/100x100/6366f1/ffffff?text=User',
        verbose_name="头像URL",
        help_text="用户头像图片链接"
    )

    # 加入日期（专门字段，对应前端"加入于"）
    join_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="加入日期",
        help_text="用户加入平台的日期"
    )

    # 练习数据（对应前端 practiceStats）
    completed_exercises = models.IntegerField(
        default=0,
        verbose_name="已完成练习",
        help_text="已完成的练习题数量"
    )
    average_accuracy = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name="平均正确率",
        help_text="单位：%"
    )
    current_rank = models.CharField(
        max_length=50,
        default="一段",
        verbose_name="当前段位",
        help_text="如：一段、二段、三段、四段等"
    )

    # 论坛数据（对应前端 forumStats）
    topics_published = models.IntegerField(
        default=0,
        verbose_name="发布主题数",
        help_text="在论坛发布的主题数量"
    )
    replies_count = models.IntegerField(
        default=0,
        verbose_name="回复数",
        help_text="在论坛的回复数量"
    )
    likes_received = models.IntegerField(
        default=0,
        verbose_name="获得点赞数",
        help_text="在论坛获得的点赞数量"
    )
>>>>>>> 89acc2758e42330758878a9ee7c626d39f72358c

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'auth_users'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def get_accuracy_display(self):
        """获取格式化的正确率"""
        return f"{self.average_accuracy}%"

    def get_user_stats(self):
        """获取用户统计数据摘要（对应前端数据结构）"""
        return {
            'username': self.username,
            'email': self.email,
            'avatar': self.avatar,
            'joinDate': str(self.join_date) if self.join_date else str(self.date_joined.date()),
            'practiceStats': {
                'completed': self.completed_exercises,
                'accuracy': float(self.average_accuracy),
                'rank': self.current_rank,
            },
            'forumStats': {
                'posts': self.topics_published,
                'replies': self.replies_count,
                'likes': self.likes_received,
            }
        }

    def is_email_verified(self):
        """检查邮箱是否已验证（对应前端的"已验证"状态）"""
        # 这里可以扩展邮箱验证逻辑
        return True  # 暂时默认已验证

    # 方便前端访问的属性
    @property
    def display_join_date(self):
        """获取显示的加入日期"""
        return self.join_date if self.join_date else self.date_joined.date()