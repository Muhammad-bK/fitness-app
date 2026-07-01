import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0003_userprofile_intelligence_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="FoodLogEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("fdc_id", models.IntegerField()),
                ("food_name", models.CharField(max_length=300)),
                ("grams", models.DecimalField(decimal_places=2, max_digits=8)),
                (
                    "meal_type",
                    models.CharField(
                        choices=[
                            ("breakfast", "Breakfast"),
                            ("lunch", "Lunch"),
                            ("dinner", "Dinner"),
                            ("snack", "Snack"),
                        ],
                        default="lunch",
                        max_length=20,
                    ),
                ),
                ("logged_date", models.DateField()),
                ("calories", models.DecimalField(decimal_places=1, max_digits=8)),
                ("protein", models.DecimalField(decimal_places=1, default=0, max_digits=8)),
                ("carbs", models.DecimalField(decimal_places=1, default=0, max_digits=8)),
                ("fat", models.DecimalField(decimal_places=1, default=0, max_digits=8)),
                ("fiber", models.DecimalField(decimal_places=1, default=0, max_digits=8)),
                ("sugar", models.DecimalField(decimal_places=1, default=0, max_digits=8)),
                ("nutrients", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="food_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "food_log_entries",
                "ordering": ["-logged_date", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="GeneratedWorkoutPlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("plan_data", models.JSONField()),
                ("split", models.CharField(max_length=30)),
                ("training_style", models.CharField(max_length=20)),
                ("workouts_per_week", models.PositiveSmallIntegerField()),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workout_plans",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "generated_workout_plans",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="foodlogentry",
            index=models.Index(fields=["user", "logged_date"], name="food_log_entries_user_date_idx"),
        ),
    ]
