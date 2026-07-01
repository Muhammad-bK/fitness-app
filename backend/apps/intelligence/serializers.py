from rest_framework import serializers

from apps.intelligence.models import FoodLogEntry, GeneratedWorkoutPlan


class GoalEstimateRequestSerializer(serializers.Serializer):
    age = serializers.IntegerField(min_value=13, max_value=120, required=False)
    gender = serializers.ChoiceField(choices=["male", "female"], required=False)
    height_cm = serializers.FloatField(min_value=100, max_value=250, required=False)
    weight_kg = serializers.FloatField(min_value=30, max_value=300, required=False)
    target_weight_kg = serializers.FloatField(min_value=30, max_value=300, required=False, allow_null=True)
    activity_level = serializers.ChoiceField(
        choices=["sedentary", "light", "moderate", "active", "very_active"],
        required=False,
    )
    goal_type = serializers.ChoiceField(
        choices=["fat_loss", "muscle_gain", "maintenance"],
        required=False,
    )
    experience_level = serializers.ChoiceField(
        choices=["beginner", "intermediate", "advanced"],
        required=False,
    )
    calorie_adjustment = serializers.IntegerField(min_value=100, max_value=1000, required=False)


class MacroBreakdownSerializer(serializers.Serializer):
    protein_g = serializers.FloatField()
    fat_g = serializers.FloatField()
    carbs_g = serializers.FloatField()
    protein_pct = serializers.FloatField()
    fat_pct = serializers.FloatField()
    carbs_pct = serializers.FloatField()


class WeeklyProjectionSerializer(serializers.Serializer):
    week = serializers.IntegerField()
    projected_weight_kg = serializers.FloatField()
    date = serializers.CharField()


class GoalEstimateResponseSerializer(serializers.Serializer):
    bmr = serializers.FloatField()
    tdee = serializers.FloatField()
    calorie_target = serializers.FloatField()
    calorie_adjustment = serializers.IntegerField()
    macro_breakdown = MacroBreakdownSerializer()
    estimated_completion_date = serializers.CharField(allow_null=True)
    weeks_needed = serializers.FloatField(allow_null=True)
    weekly_weight_projection = WeeklyProjectionSerializer(many=True)
    weekly_loss_kg = serializers.FloatField(allow_null=True)
    weekly_gain_kg = serializers.FloatField(allow_null=True)
    confidence_score = serializers.FloatField()


class FoodLogCreateSerializer(serializers.Serializer):
    fdc_id = serializers.IntegerField()
    grams = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=1)
    food_name = serializers.CharField(max_length=300, required=False)
    meal_type = serializers.ChoiceField(
        choices=["breakfast", "lunch", "dinner", "snack"],
        default="lunch",
    )
    logged_date = serializers.DateField(required=False)


class FoodLogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodLogEntry
        fields = [
            "id",
            "fdc_id",
            "food_name",
            "grams",
            "meal_type",
            "logged_date",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "sugar",
            "nutrients",
            "created_at",
        ]


class WorkoutGenerateSerializer(serializers.Serializer):
    goal_type = serializers.ChoiceField(
        choices=["fat_loss", "muscle_gain", "maintenance"],
        required=False,
    )
    experience_level = serializers.ChoiceField(
        choices=["beginner", "intermediate", "advanced"],
        required=False,
    )
    workouts_per_week = serializers.IntegerField(min_value=1, max_value=7, required=False)
    split = serializers.ChoiceField(
        choices=["push_pull_legs", "upper_lower", "full_body"],
        required=False,
    )


class GeneratedWorkoutPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedWorkoutPlan
        fields = [
            "id",
            "plan_data",
            "split",
            "training_style",
            "workouts_per_week",
            "is_active",
            "created_at",
        ]
