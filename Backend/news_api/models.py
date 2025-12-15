from django.db import models
# news_api/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="分类名称")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="URL标识")
    label = models.CharField(max_length=50, blank=True, verbose_name="显示标签", help_text="如果设置，前端将显示此标签而不是分类名称")
    description = models.TextField(blank=True, verbose_name="描述")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "新闻分类"
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class Article(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
        ('archived', '已归档'),
    ]

    title = models.CharField(max_length=200, verbose_name="标题")
    content = models.TextField(verbose_name="内容")
    summary = models.CharField(max_length=300, blank=True, verbose_name="摘要")
    cover_image = models.ImageField(upload_to='news/covers/', blank=True, null=True, verbose_name="封面图")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="作者")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="分类")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="状态")
    views = models.PositiveIntegerField(default=0, verbose_name="浏览量")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="发布时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "新闻文章"
        verbose_name_plural = verbose_name
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class TeamRank(models.Model):
    rank = models.PositiveIntegerField(verbose_name="排名")
    team_name = models.CharField(max_length=100, verbose_name="战队名称")
    score = models.CharField(max_length=50, verbose_name="积分")
    season = models.CharField(max_length=50, default="2023赛季", verbose_name="赛季")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="最后更新")

    class Meta:
        verbose_name = "战队排名"
        verbose_name_plural = verbose_name
        ordering = ['rank']
        unique_together = ['rank', 'season']

    def __str__(self):
        return f"{self.team_name} - 第{self.rank}名"
# Create your models here.
