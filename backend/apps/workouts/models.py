import uuid

from django.conf import settings
from django.db import models


class WorkoutSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workout_sessions",
    )
    session_name = models.CharField(max_length=200, blank=True, default="")
    body_weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    body_weight_unit = models.CharField(
        max_length=3,
        choices=[("kg", "Kilograms"), ("lbs", "Pounds")],
        null=True,
        blank=True,
    )
    workout_date = models.DateField()
    notes = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workout_sessions"
        indexes = [
            models.Index(fields=["user", "workout_date"]),
        ]
        ordering = ["-workout_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.session_name or 'Workout'} — {self.workout_date}"


class WorkoutExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="workout_exercises",
    )
    exercise = models.ForeignKey(
        "exercises.Exercise",
        on_delete=models.PROTECT,
        related_name="workout_exercises",
    )
    order_in_session = models.IntegerField(default=1)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workout_exercises"
        indexes = [
            models.Index(fields=["workout_session"]),
            models.Index(fields=["exercise"]),
        ]
        ordering = ["order_in_session"]

    def __str__(self) -> str:
        return f"{self.exercise.name} (#{self.order_in_session})"


class ExerciseSet(models.Model):
    class SetType(models.TextChoices):
        WORKING = "working", "Working"
        WARMUP = "warmup", "Warmup"
        DROPSET = "dropset", "Dropset"
        FAILURE = "failure", "Failure"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_exercise = models.ForeignKey(
        WorkoutExercise,
        on_delete=models.CASCADE,
        related_name="sets",
    )
    set_number = models.IntegerField()
    set_type = models.CharField(max_length=10, choices=SetType.choices, default=SetType.WORKING)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    weight_unit = models.CharField(
        max_length=3,
        choices=[("kg", "Kilograms"), ("lbs", "Pounds")],
        null=True,
        blank=True,
    )
    reps = models.IntegerField()
    rest_time_seconds = models.IntegerField(null=True, blank=True)
    had_spotter = models.BooleanField(default=False)
    paused = models.BooleanField(default=False)
    pause_at_rep = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "exercise_sets"
        indexes = [
            models.Index(fields=["workout_exercise"]),
        ]
        ordering = ["set_number"]

    def __str__(self) -> str:
        weight = f"{self.weight_kg}kg" if self.weight_kg else "BW"
        return f"Set {self.set_number}: {weight} × {self.reps}"
