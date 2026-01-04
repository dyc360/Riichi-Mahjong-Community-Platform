# news_api/serializers.py
from rest_framework import serializers
from .models import Article, Category, TeamRank, MajSoulNews


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


class MajSoulNewsSerializer(serializers.ModelSerializer):
    """雀魂新闻序列化器"""
    class Meta:
        model = MajSoulNews
        fields = [
            'id', 'title', 'description', 'link', 'image_url',
            'published_at', 'category', 'source', 'last_updated'
        ]
        read_only_fields = ['id', 'last_updated', 'created_at']


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