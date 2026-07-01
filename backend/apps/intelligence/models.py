import uuid

from django.conf import settings
from django.db import models


class FoodLogEntry(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="food_logs")
    fdc_id = models.IntegerField()
    food_name = models.CharField(max_length=300)
    grams = models.DecimalField(max_digits=8, decimal_places=2)
    meal_type = models.CharField(max_length=20, choices=MealType.choices, default=MealType.LUNCH)
    logged_date = models.DateField()
    calories = models.DecimalField(max_digits=8, decimal_places=1)
    protein = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    carbs = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    fat = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    fiber = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    sugar = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    nutrients = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "food_log_entries"
        ordering = ["-logged_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "logged_date"]),
        ]


class GeneratedWorkoutPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workout_plans")
    plan_data = models.JSONField()
    split = models.CharField(max_length=30)
    training_style = models.CharField(max_length=20)
    workouts_per_week = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "generated_workout_plans"
        ordering = ["-created_at"]
