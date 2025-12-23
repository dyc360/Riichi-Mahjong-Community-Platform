from rest_framework import serializers
from .models import Naze300Question


class Naze300QuestionSerializer(serializers.ModelSerializer):
    correct_rate = serializers.SerializerMethodField()

    class Meta:
        model = Naze300Question
        fields = [
            'question_id', 'title', 'difficulty', 'category',
            'hand_tiles', 'discard_options', 'round_wind', 'player_wind',
            'tsumi_number', 'dora_indicators', 'ura_dora_indicators',
            'correct_discard', 'correct_reason', 'additional_notes',
            'total_attempts', 'correct_attempts', 'correct_rate'
        ]
        read_only_fields = ['total_attempts', 'correct_attempts', 'correct_rate']

    def get_correct_rate(self, obj):
        return obj.get_correct_rate()

    def create(self, validated_data):
        # 确保question_id是唯一的
        question_id = validated_data.get('question_id')
        if Naze300Question.objects.filter(question_id=question_id).exists():
            raise serializers.ValidationError({'question_id': '题目ID已存在'})
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # 如果更新question_id，确保新ID不与其他记录冲突
        new_question_id = validated_data.get('question_id')
        if new_question_id and new_question_id != instance.question_id:
            if Naze300Question.objects.filter(question_id=new_question_id).exists():
                raise serializers.ValidationError({'question_id': '题目ID已存在'})
        return super().update(instance, validated_data)