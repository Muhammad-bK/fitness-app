from django.contrib import admin

from apps.intelligence.models import FoodLogEntry, GeneratedWorkoutPlan


@admin.register(FoodLogEntry)
class FoodLogEntryAdmin(admin.ModelAdmin):
    list_display = ("food_name", "user", "logged_date", "meal_type", "calories")
    list_filter = ("meal_type", "logged_date")


@admin.register(GeneratedWorkoutPlan)
class GeneratedWorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ("user", "split", "training_style", "workouts_per_week", "is_active", "created_at")
