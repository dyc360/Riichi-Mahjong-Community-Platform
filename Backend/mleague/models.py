"""
M-League数据模型
存储从官网抓取的M-League数据
"""
from django.db import models
from django.utils import timezone
import json


class TeamRanking(models.Model):
    """队伍排名数据"""
    rank = models.PositiveIntegerField(verbose_name="排名", db_index=True)
    team_name = models.CharField(max_length=100, verbose_name="队伍名称")
    score = models.CharField(max_length=50, verbose_name="积分")
    season = models.CharField(max_length=50, default="2025赛季", verbose_name="赛季", db_index=True)
    last_updated = models.DateTimeField(auto_now=True, verbose_name="最后更新时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "队伍排名"
        verbose_name_plural = "队伍排名"
        ordering = ['season', 'rank']
        unique_together = [['rank', 'season']]
        indexes = [
            models.Index(fields=['season', 'rank']),
        ]

    def __str__(self):
        return f"{self.season} - {self.team_name} (第{self.rank}名)"


class Match(models.Model):
    """比赛/赛程数据"""
    match_id = models.CharField(max_length=100, unique=True, verbose_name="比赛ID", db_index=True, null=True, blank=True)
    date = models.DateField(verbose_name="比赛日期", db_index=True)
    day = models.PositiveIntegerField(verbose_name="日期（日）", null=True, blank=True)
    month = models.PositiveIntegerField(verbose_name="月份", null=True, blank=True)
    year = models.PositiveIntegerField(verbose_name="年份", null=True, blank=True)
    day_week = models.CharField(max_length=10, verbose_name="星期", blank=True)
    status = models.CharField(max_length=20, choices=[
        ('upcoming', '即将开始'),
        ('finished', '已完成'),
    ], default='upcoming', verbose_name="状态", db_index=True)
    teams = models.JSONField(verbose_name="参赛队伍", default=list, help_text="队伍信息列表")
    result = models.JSONField(verbose_name="比赛结果", null=True, blank=True, help_text="比赛详细结果")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="最后更新时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "比赛"
        verbose_name_plural = "比赛"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status', 'date']),
            models.Index(fields=['year', 'month']),
        ]

    def __str__(self):
        teams_str = ', '.join([t.get('name', '') for t in self.teams[:2]])
        return f"{self.date} - {teams_str}"


class TeamPlayerStats(models.Model):
    """队伍选手统计数据"""
    team_id = models.CharField(max_length=100, verbose_name="队伍ID", blank=True, db_index=True)
    team_name = models.CharField(max_length=100, verbose_name="队伍名称", db_index=True)
    season = models.CharField(max_length=50, default="2025赛季", verbose_name="赛季", db_index=True)
    players = models.JSONField(verbose_name="选手数据", default=list, help_text="选手统计信息列表")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="最后更新时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "队伍选手统计"
        verbose_name_plural = "队伍选手统计"
        ordering = ['season', 'team_name']
        unique_together = [['team_name', 'season']]
        indexes = [
            models.Index(fields=['season', 'team_name']),
        ]

    def __str__(self):
        return f"{self.season} - {self.team_name}"


class PointsData(models.Model):
    """积分数据"""
    POINTS_TYPE_CHOICES = [
        ('total_points', '综合积分'),
        ('regular_points', 'Regular积分'),
        ('postseason_points', 'Post-season积分'),
        ('semifinal_points', 'Semifinal积分'),
        ('final_points', 'Final积分'),
    ]
    
    points_type = models.CharField(max_length=50, choices=POINTS_TYPE_CHOICES, verbose_name="积分类型", db_index=True)
    team_data = models.JSONField(verbose_name="队伍积分数据", default=list, help_text="各队伍的积分数据列表")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="最后更新时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "积分数据"
        verbose_name_plural = "积分数据"
        ordering = ['-last_updated']
        unique_together = [['points_type']]
        indexes = [
            models.Index(fields=['points_type', '-last_updated']),
        ]

    def __str__(self):
        return f"{self.get_points_type_display()} - {self.last_updated.strftime('%Y-%m-%d %H:%M')}"
