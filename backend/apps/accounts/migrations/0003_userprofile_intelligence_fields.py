import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_equipment_musclegroup_user_is_onboarded_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="activity_level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("sedentary", "Sedentary"),
                    ("light", "Light"),
                    ("moderate", "Moderate"),
                    ("active", "Active"),
                    ("very_active", "Very Active"),
                ],
                default="moderate",
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="calorie_deficit",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Daily calorie deficit for fat loss (250/500/750)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="calorie_surplus",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Daily calorie surplus for muscle gain (200-500)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="dietary_preferences",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
