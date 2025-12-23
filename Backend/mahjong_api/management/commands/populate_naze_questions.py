from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from mahjong_api.models import Naze300Question

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate Naze300 questions into database'

    def handle(self, *args, **options):
        # 示例题目数据（基于前端当前的模拟数据）
        questions_data = [
            {
                'question_id': 1,
                'title': '《何切300问》题目 1',
                'difficulty': 'easy',
                'category': 'basic',
                'hand_tiles': '1m2m3m4m5m6m7m8m9m1p1p1p2p',
                'discard_options': ['1m', '9m', '1p'],
                'correct_discard': '1m',
                'correct_reason': '切1m可以形成断幺九的平和三色，进张更广。',
                'additional_notes': '这是经典的何切题目，考验对三色和断幺的理解。'
            },
            {
                'question_id': 2,
                'title': '《何切300问》题目 2',
                'difficulty': 'easy',
                'category': 'basic',
                'hand_tiles': '2m3m4m5m6m7m1p2p3p4p5p6p7p1m',
                'discard_options': ['2m', '7m', '1p', '7p'],
                'correct_discard': '1p',
                'correct_reason': '切1p可以形成断幺九的平和一通，保持更好的听牌结构。',
                'additional_notes': '注意进张范围和役种的平衡。'
            },
            {
                'question_id': 3,
                'title': '《何切300问》题目 3',
                'difficulty': 'medium',
                'category': 'intermediate',
                'hand_tiles': '1m1m1m2p3p4p5p6p7p8p9p9p9p2m3m4m',
                'discard_options': ['2p', '8p', '9p'],
                'correct_discard': '2p',
                'correct_reason': '切2p可以形成三色同顺和一杯口，价值更高。',
                'additional_notes': '优先考虑复合役的形成。'
            },
        ]

        # 获取或创建管理员用户
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(is_staff=True).first()
        if not admin_user:
            admin_user = User.objects.first()

        created_count = 0
        updated_count = 0

        for question_data in questions_data:
            question, created = Naze300Question.objects.update_or_create(
                question_id=question_data['question_id'],
                defaults={
                    'title': question_data['title'],
                    'difficulty': question_data['difficulty'],
                    'category': question_data['category'],
                    'hand_tiles': question_data['hand_tiles'],
                    'discard_options': question_data['discard_options'],
                    'correct_discard': question_data['correct_discard'],
                    'correct_reason': question_data['correct_reason'],
                    'additional_notes': question_data['additional_notes'],
                    'created_by': admin_user,
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created question {question.question_id}: {question.title}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated question {question.question_id}: {question.title}')
                )

        # 为剩余的题目创建占位符（1-300）
        for i in range(4, 301):
            question, created = Naze300Question.objects.get_or_create(
                question_id=i,
                defaults={
                    'title': f'《何切300问》题目 {i}',
                    'difficulty': 'easy' if i <= 100 else 'medium' if i <= 200 else 'hard',
                    'category': 'basic' if i <= 100 else 'intermediate' if i <= 200 else 'advanced',
                    'hand_tiles': '1m2m3m4m5m6m7m8m9m1p1p1p2p',  # 默认手牌
                    'discard_options': ['1m', '9m', '1p'],
                    'correct_discard': '1m',
                    'correct_reason': '这是占位符题目，请更新具体内容。',
                    'additional_notes': '',
                    'created_by': admin_user,
                }
            )

            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count} new questions and {updated_count} updates. '
                f'Total questions: {Naze300Question.objects.count()}'
            )
        )