# Generated manually for adding MajSoulNews model

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('news_api', '0002_category_label'),
    ]

    operations = [
        migrations.CreateModel(
            name='MajSoulNews',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(db_index=True, max_length=300, verbose_name='标题')),
                ('description', models.TextField(blank=True, verbose_name='描述')),
                ('link', models.URLField(unique=True, verbose_name='原文链接')),
                ('image_url', models.URLField(blank=True, verbose_name='图片链接')),
                ('published_at', models.DateTimeField(db_index=True, verbose_name='发布时间')),
                ('category', models.CharField(blank=True, help_text='如: maintenance, events, news等', max_length=50, verbose_name='分类')),
                ('source', models.CharField(default='雀魂官网', max_length=100, verbose_name='来源')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='是否有效')),
                ('last_updated', models.DateTimeField(auto_now=True, verbose_name='最后更新时间')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
            ],
            options={
                'verbose_name': '雀魂新闻',
                'verbose_name_plural': '雀魂新闻',
                'ordering': ['-published_at', '-created_at'],
                'indexes': [
                    models.Index(fields=['published_at'], name='majsoul_news_published_at_idx'),
                    models.Index(fields=['is_active', 'published_at'], name='majsoul_news_active_published_at_idx'),
                    models.Index(fields=['category', 'published_at'], name='majsoul_news_category_published_at_idx'),
                ],
            },
        ),
    ]