from django.contrib import admin

from .models import Exercise


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "muscle_group", "category", "is_global", "created_by", "created_at"]
    list_filter = ["category", "is_global", "muscle_group"]
    search_fields = ["name", "muscle_group"]
    readonly_fields = ["id", "created_at"]
    ordering = ["name"]
