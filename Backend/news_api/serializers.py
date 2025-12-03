# news_api/serializers.py
from rest_framework import serializers
from .models import Article, Category, TeamRank


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class ArticleListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'summary', 'cover_image', 'category_name',
            'author_name', 'published_at', 'views', 'status'
        ]


class ArticleDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = '__all__'


class TeamRankSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamRank
        fields = '__all__'