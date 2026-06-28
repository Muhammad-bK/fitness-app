from django.contrib import admin

from .models import ExerciseSet, WorkoutExercise, WorkoutSession


class ExerciseSetInline(admin.TabularInline):
    model = ExerciseSet
    extra = 0
    fields = [
        "set_number",
        "set_type",
        "weight_kg",
        "weight_unit",
        "reps",
        "rest_time_seconds",
        "had_spotter",
        "paused",
        "notes",
    ]
    readonly_fields = ["id"]
    ordering = ["set_number"]


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 0
    fields = ["order_in_session", "exercise", "notes"]
    readonly_fields = ["id"]
    ordering = ["order_in_session"]
    show_change_link = True


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ["session_name", "user", "workout_date", "body_weight_kg", "created_at"]
    list_filter = ["workout_date", "user"]
    search_fields = ["session_name", "user__email", "notes"]
    readonly_fields = ["id", "created_at"]
    date_hierarchy = "workout_date"
    inlines = [WorkoutExerciseInline]


@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(admin.ModelAdmin):
    list_display = ["exercise", "workout_session", "order_in_session", "created_at"]
    list_filter = ["exercise"]
    search_fields = ["exercise__name", "workout_session__session_name"]
    readonly_fields = ["id", "created_at"]
    inlines = [ExerciseSetInline]


@admin.register(ExerciseSet)
class ExerciseSetAdmin(admin.ModelAdmin):
    list_display = ["workout_exercise", "set_number", "set_type", "weight_kg", "reps", "created_at"]
    list_filter = ["set_type"]
    readonly_fields = ["id", "created_at"]
