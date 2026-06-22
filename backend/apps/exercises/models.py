import uuid

from django.conf import settings
from django.db import models


class Exercise(models.Model):
    class Category(models.TextChoices):
        BARBELL = "barbell", "Barbell"
        DUMBBELL = "dumbbell", "Dumbbell"
        CABLE = "cable", "Cable"
        MACHINE = "machine", "Machine"
        BODYWEIGHT = "bodyweight", "Bodyweight"
        OTHER = "other", "Other"

    SUGGESTED_MUSCLE_GROUPS = [
        "chest", "back", "shoulders", "biceps", "triceps",
        "quadriceps", "hamstrings", "glutes", "calves", "core",
        "forearms", "traps", "lats", "full_body",
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    muscle_group = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.BARBELL)
    is_global = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_exercises",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "exercises"
        indexes = [
            models.Index(fields=["created_by"]),
            models.Index(fields=["is_global"]),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
