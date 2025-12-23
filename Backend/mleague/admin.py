<<<<<<< HEAD
"""
Django Admin配置 - M-League数据（只读）
管理员可以通过localhost:8000/admin/查看数据，但不能修改
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import TeamRanking, Match, TeamPlayerStats, PointsData
import json


@admin.register(TeamRanking)
class TeamRankingAdmin(admin.ModelAdmin):
    """队伍排名管理（只读）"""
    list_display = ['rank', 'team_name', 'score', 'season', 'last_updated']
    list_filter = ['season', 'last_updated']
    search_fields = ['team_name', 'season']
    readonly_fields = ['rank', 'team_name', 'score', 'season', 'last_updated', 'created_at']
    ordering = ['season', 'rank']
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    """比赛管理（只读）"""
    list_display = ['date', 'teams_display', 'status', 'last_updated']
    list_filter = ['status', 'date', 'year', 'month']
    search_fields = ['match_id', 'date']
    readonly_fields = [
        'match_id', 'date', 'day', 'month', 'year', 'day_week', 
        'status', 'teams', 'result', 'last_updated', 'created_at',
        'teams_formatted', 'result_formatted'
    ]
    ordering = ['-date', '-created_at']
    date_hierarchy = 'date'
    
    def teams_display(self, obj):
        """显示队伍名称"""
        if obj.teams:
            team_names = [t.get('name', '') for t in obj.teams]
            return ', '.join(team_names[:4])  # 最多显示4个队伍
        return '-'
    teams_display.short_description = '参赛队伍'
    
    def teams_formatted(self, obj):
        """格式化显示队伍信息"""
        if obj.teams:
            html = '<ul>'
            for team in obj.teams:
                name = team.get('name', '')
                logo = team.get('logo', '')
                if logo:
                    html += f'<li><img src="{logo}" style="width: 20px; height: 20px; margin-right: 5px;">{name}</li>'
                else:
                    html += f'<li>{name}</li>'
            html += '</ul>'
            return format_html(html)
        return '-'
    teams_formatted.short_description = '队伍详情'
    
    def result_formatted(self, obj):
        """格式化显示比赛结果"""
        if obj.result:
            try:
                result_json = json.dumps(obj.result, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 400px; overflow: auto;">{}</pre>', result_json)
            except:
                return str(obj.result)
        return '-'
    result_formatted.short_description = '比赛结果'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(TeamPlayerStats)
class TeamPlayerStatsAdmin(admin.ModelAdmin):
    """队伍选手统计管理（只读）"""
    list_display = ['team_name', 'season', 'players_count', 'last_updated']
    list_filter = ['season', 'last_updated']
    search_fields = ['team_name', 'season']
    readonly_fields = [
        'team_id', 'team_name', 'season', 'players', 
        'last_updated', 'created_at', 'players_formatted'
    ]
    ordering = ['season', 'team_name']
    
    def players_count(self, obj):
        """显示选手数量"""
        if obj.players:
            return len(obj.players)
        return 0
    players_count.short_description = '选手数量'
    
    def players_formatted(self, obj):
        """格式化显示选手数据"""
        if obj.players:
            try:
                players_json = json.dumps(obj.players, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 500px; overflow: auto;">{}</pre>', players_json)
            except:
                return str(obj.players)
        return '-'
    players_formatted.short_description = '选手数据详情'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(PointsData)
class PointsDataAdmin(admin.ModelAdmin):
    """积分数据管理（只读）"""
    list_display = ['points_type_display', 'teams_count', 'last_updated']
    list_filter = ['points_type', 'last_updated']
    readonly_fields = [
        'points_type', 'team_data', 'last_updated', 'created_at', 
        'team_data_formatted'
    ]
    ordering = ['-last_updated']
    
    def points_type_display(self, obj):
        """显示积分类型"""
        return obj.get_points_type_display()
    points_type_display.short_description = '积分类型'
    
    def teams_count(self, obj):
        """显示队伍数量"""
        if obj.team_data:
            return len(obj.team_data)
        return 0
    teams_count.short_description = '队伍数量'
    
    def team_data_formatted(self, obj):
        """格式化显示积分数据"""
        if obj.team_data:
            try:
                data_json = json.dumps(obj.team_data, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 500px; overflow: auto;">{}</pre>', data_json)
            except:
                return str(obj.team_data)
        return '-'
    team_data_formatted.short_description = '积分数据详情'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False
=======
"""
Django Admin配置 - M-League数据（只读）
管理员可以通过localhost:8000/admin/查看数据，但不能修改
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import TeamRanking, Match, TeamPlayerStats, PointsData
import json


@admin.register(TeamRanking)
class TeamRankingAdmin(admin.ModelAdmin):
    """队伍排名管理（只读）"""
    list_display = ['rank', 'team_name', 'score', 'season', 'last_updated']
    list_filter = ['season', 'last_updated']
    search_fields = ['team_name', 'season']
    readonly_fields = ['rank', 'team_name', 'score', 'season', 'last_updated', 'created_at']
    ordering = ['season', 'rank']
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    """比赛管理（只读）"""
    list_display = ['date', 'teams_display', 'status', 'last_updated']
    list_filter = ['status', 'date', 'year', 'month']
    search_fields = ['match_id', 'date']
    readonly_fields = [
        'match_id', 'date', 'day', 'month', 'year', 'day_week', 
        'status', 'teams', 'result', 'last_updated', 'created_at',
        'teams_formatted', 'result_formatted'
    ]
    ordering = ['-date', '-created_at']
    date_hierarchy = 'date'
    
    def teams_display(self, obj):
        """显示队伍名称"""
        if obj.teams:
            team_names = [t.get('name', '') for t in obj.teams]
            return ', '.join(team_names[:4])  # 最多显示4个队伍
        return '-'
    teams_display.short_description = '参赛队伍'
    
    def teams_formatted(self, obj):
        """格式化显示队伍信息"""
        if obj.teams:
            html = '<ul>'
            for team in obj.teams:
                name = team.get('name', '')
                logo = team.get('logo', '')
                if logo:
                    html += f'<li><img src="{logo}" style="width: 20px; height: 20px; margin-right: 5px;">{name}</li>'
                else:
                    html += f'<li>{name}</li>'
            html += '</ul>'
            return format_html(html)
        return '-'
    teams_formatted.short_description = '队伍详情'
    
    def result_formatted(self, obj):
        """格式化显示比赛结果"""
        if obj.result:
            try:
                result_json = json.dumps(obj.result, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 400px; overflow: auto;">{}</pre>', result_json)
            except:
                return str(obj.result)
        return '-'
    result_formatted.short_description = '比赛结果'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(TeamPlayerStats)
class TeamPlayerStatsAdmin(admin.ModelAdmin):
    """队伍选手统计管理（只读）"""
    list_display = ['team_name', 'season', 'players_count', 'last_updated']
    list_filter = ['season', 'last_updated']
    search_fields = ['team_name', 'season']
    readonly_fields = [
        'team_id', 'team_name', 'season', 'players', 
        'last_updated', 'created_at', 'players_formatted'
    ]
    ordering = ['season', 'team_name']
    
    def players_count(self, obj):
        """显示选手数量"""
        if obj.players:
            return len(obj.players)
        return 0
    players_count.short_description = '选手数量'
    
    def players_formatted(self, obj):
        """格式化显示选手数据"""
        if obj.players:
            try:
                players_json = json.dumps(obj.players, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 500px; overflow: auto;">{}</pre>', players_json)
            except:
                return str(obj.players)
        return '-'
    players_formatted.short_description = '选手数据详情'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False


@admin.register(PointsData)
class PointsDataAdmin(admin.ModelAdmin):
    """积分数据管理（只读）"""
    list_display = ['points_type_display', 'teams_count', 'last_updated']
    list_filter = ['points_type', 'last_updated']
    readonly_fields = [
        'points_type', 'team_data', 'last_updated', 'created_at', 
        'team_data_formatted'
    ]
    ordering = ['-last_updated']
    
    def points_type_display(self, obj):
        """显示积分类型"""
        return obj.get_points_type_display()
    points_type_display.short_description = '积分类型'
    
    def teams_count(self, obj):
        """显示队伍数量"""
        if obj.team_data:
            return len(obj.team_data)
        return 0
    teams_count.short_description = '队伍数量'
    
    def team_data_formatted(self, obj):
        """格式化显示积分数据"""
        if obj.team_data:
            try:
                data_json = json.dumps(obj.team_data, ensure_ascii=False, indent=2)
                return format_html('<pre style="max-height: 500px; overflow: auto;">{}</pre>', data_json)
            except:
                return str(obj.team_data)
        return '-'
    team_data_formatted.short_description = '积分数据详情'
    
    def has_add_permission(self, request):
        """禁止添加"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """禁止删除"""
        return False
>>>>>>> 341ee1821bebe0096ea2c5baa3f2af0d04b9c515
