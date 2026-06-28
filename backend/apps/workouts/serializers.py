"""
Serializers for workout sessions, exercises, and sets.

The nested write serializer accepts a full workout in one POST and handles
kg conversion + unit snapshotting at the serializer layer.
"""

from decimal import Decimal

from django.db.models import Q
from rest_framework import serializers

from apps.exercises.models import Exercise
from apps.exercises.serializers import ExerciseSerializer

from .models import ExerciseSet, WorkoutExercise, WorkoutSession
from .utils import convert_to_kg, display_weight

# --- Read serializers (for GET responses) ---


class ExerciseSetReadSerializer(serializers.ModelSerializer):
    display_weight = serializers.SerializerMethodField()

    class Meta:
        model = ExerciseSet
        fields = [
            "id",
            "set_number",
            "set_type",
            "weight_kg",
            "weight_unit",
            "display_weight",
            "reps",
            "rest_time_seconds",
            "had_spotter",
            "paused",
            "pause_at_rep",
            "notes",
            "created_at",
        ]

    def get_display_weight(self, obj) -> dict | None:
        if obj.weight_kg is None:
            return None
        user = self.context["request"].user
        return {
            "value": str(display_weight(obj.weight_kg, user.unit_preference)),
            "unit": user.unit_preference,
        }


class WorkoutExerciseReadSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    sets = ExerciseSetReadSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = ["id", "exercise", "order_in_session", "notes", "sets", "created_at"]


class WorkoutSessionReadSerializer(serializers.ModelSerializer):
    workout_exercises = WorkoutExerciseReadSerializer(many=True, read_only=True)
    display_body_weight = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "session_name",
            "body_weight_kg",
            "body_weight_unit",
            "display_body_weight",
            "workout_date",
            "notes",
            "started_at",
            "ended_at",
            "workout_exercises",
            "created_at",
        ]

    def get_display_body_weight(self, obj) -> dict | None:
        if obj.body_weight_kg is None:
            return None
        user = self.context["request"].user
        return {
            "value": str(display_weight(obj.body_weight_kg, user.unit_preference)),
            "unit": user.unit_preference,
        }


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list view — omits nested sets."""

    exercise_count = serializers.IntegerField(read_only=True)
    set_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "session_name",
            "body_weight_kg",
            "body_weight_unit",
            "workout_date",
            "notes",
            "started_at",
            "ended_at",
            "exercise_count",
            "set_count",
            "created_at",
        ]


# --- Write serializers (for POST/PATCH) ---


class ExerciseSetWriteSerializer(serializers.Serializer):
    set_number = serializers.IntegerField()
    set_type = serializers.ChoiceField(choices=ExerciseSet.SetType.choices, default="working")
    weight = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
    weight_unit = serializers.ChoiceField(choices=[("kg", "kg"), ("lbs", "lbs")], required=False, allow_null=True)
    reps = serializers.IntegerField(min_value=0)
    rest_time_seconds = serializers.IntegerField(required=False, allow_null=True)
    had_spotter = serializers.BooleanField(default=False)
    paused = serializers.BooleanField(default=False)
    pause_at_rep = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data: dict) -> dict:
        weight = data.get("weight")
        weight_unit = data.get("weight_unit")
        if weight is not None and weight_unit is None:
            raise serializers.ValidationError("weight_unit is required when weight is provided.")
        return data


class WorkoutExerciseWriteSerializer(serializers.Serializer):
    exercise_id = serializers.UUIDField()
    order_in_session = serializers.IntegerField(default=1)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    sets = ExerciseSetWriteSerializer(many=True)

    def validate_sets(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("At least one set is required.")
        return value


class WorkoutSessionWriteSerializer(serializers.Serializer):
    """
    Accepts a full workout session including exercises and sets in one request.
    Converts weight values to kg for storage and snapshots the entered unit.
    """

    session_name = serializers.CharField(required=False, allow_blank=True, default="")
    workout_date = serializers.DateField()
    body_weight = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    body_weight_unit = serializers.ChoiceField(choices=[("kg", "kg"), ("lbs", "lbs")], required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    started_at = serializers.DateTimeField(required=False, allow_null=True)
    ended_at = serializers.DateTimeField(required=False, allow_null=True)
    exercises = WorkoutExerciseWriteSerializer(many=True)

    def validate(self, data: dict) -> dict:
        bw = data.get("body_weight")
        bw_unit = data.get("body_weight_unit")
        if bw is not None and bw_unit is None:
            raise serializers.ValidationError("body_weight_unit is required when body_weight is provided.")
        if not data.get("exercises"):
            raise serializers.ValidationError("At least one exercise is required.")
        return data

    def create(self, validated_data: dict) -> WorkoutSession:
        user = self.context["request"].user
        exercises_data = validated_data.pop("exercises")

        # Validate exercise access
        ids = [str(ex["exercise_id"]) for ex in exercises_data]
        accessible = Exercise.objects.filter(id__in=ids).filter(Q(is_global=True) | Q(created_by=user))
        found = {str(e.id): e for e in accessible}
        missing = set(ids) - set(found.keys())
        if missing:
            raise serializers.ValidationError(f"Exercises not found or not accessible: {missing}")

        # Convert body weight
        bw = validated_data.pop("body_weight", None)
        bw_unit = validated_data.pop("body_weight_unit", None)
        body_weight_kg = None
        if bw is not None and bw_unit:
            body_weight_kg = convert_to_kg(Decimal(str(bw)), bw_unit)

        session = WorkoutSession.objects.create(
            user=user,
            body_weight_kg=body_weight_kg,
            body_weight_unit=bw_unit,
            **validated_data,
        )

        for ex_data in exercises_data:
            sets_data = ex_data.pop("sets")
            exercise = found[str(ex_data.pop("exercise_id"))]
            we = WorkoutExercise.objects.create(
                workout_session=session,
                exercise=exercise,
                **ex_data,
            )
            set_objects = []
            for s in sets_data:
                weight = s.pop("weight", None)
                w_unit = s.pop("weight_unit", None)
                weight_kg = None
                if weight is not None and w_unit:
                    weight_kg = convert_to_kg(Decimal(str(weight)), w_unit)
                set_objects.append(
                    ExerciseSet(
                        workout_exercise=we,
                        weight_kg=weight_kg,
                        weight_unit=w_unit,
                        **s,
                    )
                )
            ExerciseSet.objects.bulk_create(set_objects)

        return session

    def update(self, instance: WorkoutSession, validated_data: dict) -> WorkoutSession:
        user = self.context["request"].user
        exercises_data = validated_data.pop("exercises", None)

        # Update session fields
        bw = validated_data.pop("body_weight", None)
        bw_unit = validated_data.pop("body_weight_unit", None)
        if bw is not None and bw_unit:
            instance.body_weight_kg = convert_to_kg(Decimal(str(bw)), bw_unit)
            instance.body_weight_unit = bw_unit

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exercises_data is not None:
            # Replace strategy: delete old, create new
            instance.workout_exercises.all().delete()

            ids = [str(ex["exercise_id"]) for ex in exercises_data]
            accessible = Exercise.objects.filter(id__in=ids).filter(Q(is_global=True) | Q(created_by=user))
            found = {str(e.id): e for e in accessible}
            missing = set(ids) - set(found.keys())
            if missing:
                raise serializers.ValidationError(f"Exercises not found or not accessible: {missing}")

            for ex_data in exercises_data:
                sets_data = ex_data.pop("sets")
                exercise = found[str(ex_data.pop("exercise_id"))]
                we = WorkoutExercise.objects.create(
                    workout_session=instance,
                    exercise=exercise,
                    **ex_data,
                )
                set_objects = []
                for s in sets_data:
                    weight = s.pop("weight", None)
                    w_unit = s.pop("weight_unit", None)
                    weight_kg = None
                    if weight is not None and w_unit:
                        weight_kg = convert_to_kg(Decimal(str(weight)), w_unit)
                    set_objects.append(
                        ExerciseSet(
                            workout_exercise=we,
                            weight_kg=weight_kg,
                            weight_unit=w_unit,
                            **s,
                        )
                    )
                ExerciseSet.objects.bulk_create(set_objects)

        return instance
