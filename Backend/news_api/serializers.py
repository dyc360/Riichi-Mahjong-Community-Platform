# news_api/serializers.py
from rest_framework import serializers
from .models import Article, Category, TeamRank


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'label', 'description']


class ArticleListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'summary', 'cover_image', 'category_name',
            'author_name', 'published_at', 'views', 'status'
        ]


class ArticleCreateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'summary', 'cover_image',
            'category', 'category_name', 'status', 'published_at'
        ]
        read_only_fields = ['author', 'views', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


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