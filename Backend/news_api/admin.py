from django.contrib import admin

# Register your models here.
# news_api/admin.py
from django.contrib import admin
from .models import Category, Article, TeamRank


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'status', 'published_at', 'views']
    list_filter = ['category', 'status', 'published_at']
    search_fields = ['title', 'content']
    readonly_fields = ['views', 'created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not obj.author_id:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(TeamRank)
class TeamRankAdmin(admin.ModelAdmin):
    list_display = ['rank', 'team_name', 'score', 'season', 'last_updated']
    list_editable = ['score']
    ordering = ['season', 'rank']