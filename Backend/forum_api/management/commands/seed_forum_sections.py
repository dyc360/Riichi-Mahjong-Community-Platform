from django.core.management.base import BaseCommand

from forum_api.models import ForumSection


class Command(BaseCommand):
    help = "初始化论坛板块数据（技术交流、赛事讨论等）"

    def handle(self, *args, **options):
        sections_data = [
            {
                "name": "tech",
                "title": "技术交流",
                "description": "立直麻将何切讨论、战术分析、牌效研究",
                "icon": "https://placehold.co/64x64/6366f1/ffffff?text=技",
                "order": 1,
            },
            {
                "name": "competition",
                "title": "赛事讨论",
                "description": "M-League、雀魂赛事、国际锦标赛相关话题",
                "icon": "https://placehold.co/64x64/10b981/ffffff?text=赛",
                "order": 2,
            },
            {
                "name": "chat",
                "title": "休闲闲聊",
                "description": "麻将相关日常、趣味经历、表情包分享",
                "icon": "https://placehold.co/64x64/ec4899/ffffff?text=聊",
                "order": 3,
            },
            {
                "name": "newbie",
                "title": "新手提问",
                "description": "给麻将新手的答疑专区，友好交流",
                "icon": "https://placehold.co/64x64/f59e0b/ffffff?text=新",
                "order": 4,
            },
            {
                "name": "events",
                "title": "活动召集",
                "description": "线上约战、线下聚会、自定义赛事组织",
                "icon": "https://placehold.co/64x64/8b5cf6/ffffff?text=聚",
                "order": 5,
            },
        ]

        for data in sections_data:
            section, created = ForumSection.objects.get_or_create(
                name=data["name"], defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"创建板块: {section.title} ({section.name})"))
            else:
                self.stdout.write(self.style.WARNING(f"已存在板块: {section.title} ({section.name})，跳过"))

        self.stdout.write(self.style.SUCCESS("论坛板块初始化完成"))
