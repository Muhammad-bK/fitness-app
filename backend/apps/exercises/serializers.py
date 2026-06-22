from rest_framework import serializers

from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "muscle_group", "category", "is_global", "created_by", "created_at"]
        read_only_fields = ["id", "is_global", "created_by", "created_at"]

    def create(self, validated_data: dict) -> Exercise:
        validated_data["created_by"] = self.context["request"].user
        validated_data["is_global"] = False
        return super().create(validated_data)
