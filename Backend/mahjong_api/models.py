from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Naze300Question(models.Model):
    """何切300问题目模型"""

    # 难度等级
    DIFFICULTY_CHOICES = [
        ('easy', '简单'),
        ('medium', '中等'),
        ('hard', '困难'),
    ]

    # 分类
    CATEGORY_CHOICES = [
        ('basic', '基础'),
        ('intermediate', '进阶'),
        ('advanced', '高级'),
    ]

    # 题目ID (1-300)
    question_id = models.PositiveIntegerField(unique=True, help_text="题目编号 (1-300)")

    # 基本信息
    title = models.CharField(max_length=200, help_text="题目标题")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='basic')

    # 手牌信息
    hand_tiles = models.CharField(max_length=100, help_text="手牌字符串表示（14张牌）")
    discard_options = models.JSONField(help_text="可选切牌列表")

    # 场况信息
    round_wind = models.CharField(max_length=10, default='东', help_text="场风")
    player_wind = models.CharField(max_length=10, default='东', help_text="自风")
    tsumi_number = models.PositiveIntegerField(default=0, help_text="巡目/本场数")

    # 宝牌信息
    dora_indicators = models.CharField(max_length=50, blank=True, help_text="宝牌指示牌")
    ura_dora_indicators = models.CharField(max_length=50, blank=True, help_text="里宝牌指示牌")

    # 答案信息
    correct_discard = models.CharField(max_length=10, help_text="正确切牌")
    correct_reason = models.TextField(help_text="正确切牌理由")
    additional_notes = models.TextField(blank=True, help_text="补充说明")

    # 元数据
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    # 统计信息
    total_attempts = models.PositiveIntegerField(default=0, help_text="总尝试次数")
    correct_attempts = models.PositiveIntegerField(default=0, help_text="正确次数")

    class Meta:
        ordering = ['question_id']
        verbose_name = "何切300问题目"
        verbose_name_plural = "何切300问题目"

    def __str__(self):
        return f"Q{self.question_id}: {self.title}"

    def get_correct_rate(self):
        """计算正确率"""
        if self.total_attempts == 0:
            return 0
        return round((self.correct_attempts / self.total_attempts) * 100, 1)

    def record_attempt(self, is_correct):
        """记录一次尝试"""
        self.total_attempts += 1
        if is_correct:
            self.correct_attempts += 1
        self.save(update_fields=['total_attempts', 'correct_attempts'])


class UserNazeProgress(models.Model):
    """用户何切300问进度模型"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Naze300Question, on_delete=models.CASCADE)

    # 完成状态
    STATUS_CHOICES = [
        ('not_started', '未开始'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
    ]

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='not_started')
    is_correct = models.BooleanField(null=True, help_text="是否答对")

    # 时间戳
    first_attempted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # 统计
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['user', 'question']
        verbose_name = "用户何切进度"
        verbose_name_plural = "用户何切进度"

    def __str__(self):
        return f"{self.user.username} - Q{self.question.question_id}"

    def record_attempt(self, is_correct):
        """记录用户的一次尝试"""
        self.attempts_count += 1

        if self.first_attempted_at is None:
            self.first_attempted_at = timezone.now()

        if self.status == 'not_started':
            self.status = 'in_progress'

        if is_correct and self.status != 'completed':
            self.status = 'completed'
            self.completed_at = timezone.now()

        self.is_correct = is_correct
        self.save()

        # 同时更新题目的统计信息
        self.question.record_attempt(is_correct)