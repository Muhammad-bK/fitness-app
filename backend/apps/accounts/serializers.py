from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Equipment, MuscleGroup, UserProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(required=False, allow_blank=True)
    unit_preference = serializers.ChoiceField(
        choices=User.UnitPreference.choices,
        default=User.UnitPreference.KG,
    )

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(**validated_data)


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ["id", "name"]


class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = ["id", "name"]


class UserProfileSerializer(serializers.ModelSerializer):
    equipment = EquipmentSerializer(many=True, read_only=True)
    equipment_ids = serializers.PrimaryKeyRelatedField(
        source="equipment",
        queryset=Equipment.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    target_muscle_groups = MuscleGroupSerializer(many=True, read_only=True)
    target_muscle_group_ids = serializers.PrimaryKeyRelatedField(
        source="target_muscle_groups",
        queryset=MuscleGroup.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = UserProfile
        fields = [
            "date_of_birth",
            "biological_sex",
            "height",
            "current_weight",
            "target_weight",
            "current_body_type",
            "target_body_type",
            "goal_type",
            "weekly_change_rate",
            "workout_days_per_week",
            "session_length_minutes",
            "gym_type",
            "experience_level",
            "plan_source",
            "activity_level",
            "dietary_preferences",
            "calorie_deficit",
            "calorie_surplus",
            "equipment",
            "equipment_ids",
            "target_muscle_groups",
            "target_muscle_group_ids",
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "unit_preference",
            "is_onboarded",
            "onboarding_step",
            "created_at",
        ]
        read_only_fields = ["id", "email", "created_at", "is_onboarded", "onboarding_step"]


class OnboardingStateSerializer(serializers.Serializer):
    is_onboarded = serializers.BooleanField()
    onboarding_step = serializers.IntegerField()
    profile = UserProfileSerializer()


class OnboardingUpdateSerializer(serializers.Serializer):
    onboarding_step = serializers.IntegerField(required=False, min_value=0, max_value=4)
    profile = UserProfileSerializer(required=False)


class OnboardingCompleteProfileSerializer(UserProfileSerializer):
    # date_of_birth = serializers.DateField(required=True)
    # biological_sex = serializers.ChoiceField(
    #     choices=UserProfile.BiologicalSex.choices,
    #     required=True,
    # )
    # height = serializers.DecimalField(max_digits=5, decimal_places=2, required=True, min_value=0.1)
    # current_weight = serializers.DecimalField(max_digits=6, decimal_places=2, required=True, min_value=1)
    # target_weight = serializers.DecimalField(max_digits=6, decimal_places=2, required=True, min_value=1)
    # current_body_type = serializers.ChoiceField(
    #     choices=UserProfile.BodyType.choices,
    #     required=True,
    # )
    # target_body_type = serializers.ChoiceField(
    #     choices=UserProfile.BodyType.choices,
    #     required=True,
    # )
    # goal_type = serializers.ChoiceField(
    #     choices=UserProfile.GoalType.choices,
    #     required=True,
    # )
    # weekly_change_rate = serializers.DecimalField(max_digits=4, decimal_places=2, required=True)
    # workout_days_per_week = serializers.IntegerField(required=True, min_value=1, max_value=7)
    # session_length_minutes = serializers.IntegerField(required=True, min_value=10, max_value=300)
    # gym_type = serializers.ChoiceField(
    #     choices=UserProfile.GymType.choices,
    #     required=True,
    # )
    # experience_level = serializers.ChoiceField(
    #     choices=UserProfile.ExperienceLevel.choices,
    #     required=True,
    # )
    plan_source = serializers.ChoiceField(
        choices=UserProfile.PlanSource.choices,
        required=True,
    )
    # target_muscle_group_ids = serializers.PrimaryKeyRelatedField(
    #     source="target_muscle_groups",
    #     many=True,
    #     queryset=MuscleGroup.objects.all(),
    #     write_only=True,
    #     required=True,
    # )


class OnboardingCompleteSerializer(serializers.Serializer):
    profile = OnboardingCompleteProfileSerializer()
