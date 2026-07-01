"""Generate a few months of realistic workout data for a demo user."""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.exercises.models import Exercise
from apps.workouts.models import ExerciseSet, WorkoutExercise, WorkoutSession

User = get_user_model()

PUSH_EXERCISES = ["Bench Press", "Incline Bench Press", "Overhead Press", "Dip", "Tricep Pushdown"]
PULL_EXERCISES = ["Deadlift", "Barbell Row", "Lat Pulldown", "Pull Up", "Bicep Curl"]
LEG_EXERCISES = ["Squat", "Front Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Leg Extension"]

SPLITS = [
    ("Push Day", PUSH_EXERCISES),
    ("Pull Day", PULL_EXERCISES),
    ("Leg Day", LEG_EXERCISES),
]

BASE_WEIGHTS = {
    "Bench Press": Decimal("60"),
    "Incline Bench Press": Decimal("50"),
    "Overhead Press": Decimal("40"),
    "Dip": Decimal("0"),
    "Tricep Pushdown": Decimal("25"),
    "Deadlift": Decimal("100"),
    "Barbell Row": Decimal("60"),
    "Lat Pulldown": Decimal("50"),
    "Pull Up": Decimal("0"),
    "Bicep Curl": Decimal("12"),
    "Squat": Decimal("80"),
    "Front Squat": Decimal("60"),
    "Romanian Deadlift": Decimal("70"),
    "Leg Press": Decimal("120"),
    "Leg Curl": Decimal("30"),
    "Leg Extension": Decimal("35"),
}


class Command(BaseCommand):
    help = "Generate ~3 months of demo workout data for a test user."

    def add_arguments(self, parser):
        parser.add_argument("--email", default="demo@example.com", help="Demo user email")
        parser.add_argument("--password", default="demopassword123", help="Demo user password")
        parser.add_argument("--weeks", type=int, default=12, help="Weeks of data to generate")

    def handle(self, *args, **options):
        email = options["email"]
        password = options["password"]
        weeks = options["weeks"]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"display_name": "Demo User", "unit_preference": "kg"},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"Created demo user: {email}")
        else:
            self.stdout.write(f"Using existing user: {email}")

        exercises = {e.name: e for e in Exercise.objects.filter(is_global=True)}
        if not exercises:
            self.stderr.write(self.style.ERROR("No global exercises found. Run seed_exercises first."))
            return

        start_date = date.today() - timedelta(weeks=weeks)
        session_count = 0
        body_weight = Decimal("78.00")

        for week in range(weeks):
            week_start = start_date + timedelta(weeks=week)

            # Skip ~10% of weeks for realistic gaps
            if random.random() < 0.1:
                continue

            # 3-4 workouts per week
            workout_days = sorted(random.sample(range(7), k=random.choice([3, 4])))

            for day_offset in workout_days:
                workout_date = week_start + timedelta(days=day_offset)
                if workout_date > date.today():
                    break

                # Cycle through splits
                split_name, split_exercises = SPLITS[session_count % len(SPLITS)]

                # Slight body weight drift
                body_weight += Decimal(str(random.uniform(-0.3, 0.3))).quantize(Decimal("0.01"))
                body_weight = max(Decimal("70"), min(Decimal("90"), body_weight))

                session = WorkoutSession.objects.create(
                    user=user,
                    session_name=split_name,
                    workout_date=workout_date,
                    body_weight_kg=body_weight,
                    body_weight_unit="kg",
                )

                # Pick 3-4 exercises from the split
                chosen = random.sample(split_exercises, k=min(random.choice([3, 4]), len(split_exercises)))

                for order, ex_name in enumerate(chosen, 1):
                    ex = exercises.get(ex_name)
                    if not ex:
                        continue

                    we = WorkoutExercise.objects.create(
                        workout_session=session,
                        exercise=ex,
                        order_in_session=order,
                    )

                    # Progressive overload: add ~0.5-1kg per week
                    base = BASE_WEIGHTS.get(ex_name, Decimal("20"))
                    progression = base + Decimal(str(week * random.uniform(0.3, 0.8))).quantize(Decimal("0.01"))

                    # Warmup + 3-4 working sets
                    sets_data = []
                    if progression > 0:
                        sets_data.append(
                            {
                                "set_number": 1,
                                "set_type": "warmup",
                                "weight_kg": (progression * Decimal("0.5")).quantize(Decimal("0.01")),
                                "reps": 10,
                            }
                        )
                    for s in range(2, random.choice([5, 6])):
                        reps = random.choice([6, 8, 10, 12]) if s < 4 else random.choice([4, 6, 8])
                        sets_data.append(
                            {
                                "set_number": s,
                                "set_type": "working",
                                "weight_kg": progression if progression > 0 else None,
                                "reps": reps,
                                "rest_time_seconds": random.choice([90, 120, 150, 180]),
                            }
                        )

                    set_objects = [
                        ExerciseSet(
                            workout_exercise=we,
                            weight_kg=sd.get("weight_kg"),
                            weight_unit="kg" if sd.get("weight_kg") else None,
                            **{k: v for k, v in sd.items() if k not in ("weight_kg",)},
                        )
                        for sd in sets_data
                    ]
                    ExerciseSet.objects.bulk_create(set_objects)

                session_count += 1

        self.stdout.write(self.style.SUCCESS(f"Created {session_count} workout sessions over {weeks} weeks."))
