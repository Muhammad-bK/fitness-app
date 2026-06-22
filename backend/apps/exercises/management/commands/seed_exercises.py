"""Seed the global exercise library."""

from django.core.management.base import BaseCommand

from apps.exercises.models import Exercise

GLOBAL_EXERCISES = [
    {"name": "Bench Press", "muscle_group": "chest", "category": "barbell"},
    {"name": "Incline Bench Press", "muscle_group": "chest", "category": "barbell"},
    {"name": "Overhead Press", "muscle_group": "shoulders", "category": "barbell"},
    {"name": "Squat", "muscle_group": "quadriceps", "category": "barbell"},
    {"name": "Front Squat", "muscle_group": "quadriceps", "category": "barbell"},
    {"name": "Deadlift", "muscle_group": "back", "category": "barbell"},
    {"name": "Romanian Deadlift", "muscle_group": "hamstrings", "category": "barbell"},
    {"name": "Barbell Row", "muscle_group": "back", "category": "barbell"},
    {"name": "Lat Pulldown", "muscle_group": "lats", "category": "cable"},
    {"name": "Pull Up", "muscle_group": "lats", "category": "bodyweight"},
    {"name": "Dip", "muscle_group": "chest", "category": "bodyweight"},
    {"name": "Leg Press", "muscle_group": "quadriceps", "category": "machine"},
    {"name": "Leg Curl", "muscle_group": "hamstrings", "category": "machine"},
    {"name": "Leg Extension", "muscle_group": "quadriceps", "category": "machine"},
    {"name": "Bicep Curl", "muscle_group": "biceps", "category": "dumbbell"},
    {"name": "Tricep Pushdown", "muscle_group": "triceps", "category": "cable"},
]


class Command(BaseCommand):
    help = "Seed the global exercise library with standard lifts."

    def handle(self, *args, **options):
        created_count = 0
        for ex_data in GLOBAL_EXERCISES:
            _, created = Exercise.objects.get_or_create(
                name=ex_data["name"],
                is_global=True,
                defaults={
                    "muscle_group": ex_data["muscle_group"],
                    "category": ex_data["category"],
                    "created_by": None,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created_count} new global exercises ({len(GLOBAL_EXERCISES)} total)."))
