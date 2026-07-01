"""Progress analytics combining goal estimates with logged data."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate

from apps.accounts.models import UserProfile
from apps.intelligence.models import FoodLogEntry, GeneratedWorkoutPlan
from apps.intelligence.services.goal_engine import (
    GoalInput,
    age_from_dob,
    decimal_to_float,
    estimate_goal,
    map_profile_goal_type,
)
from apps.workouts.models import WorkoutSession


def build_goal_input_from_profile(profile: UserProfile, overrides: dict | None = None) -> GoalInput | None:
    overrides = overrides or {}
    dob = profile.date_of_birth
    if not dob and not overrides.get("age"):
        return None

    age = overrides.get("age") or age_from_dob(dob)
    gender = overrides.get("gender") or profile.biological_sex
    if gender not in ("male", "female"):
        gender = "male"

    height = overrides.get("height_cm") or decimal_to_float(profile.height)
    weight = overrides.get("weight_kg") or decimal_to_float(profile.current_weight)
    if not height or not weight:
        return None

    activity = overrides.get("activity_level") or profile.activity_level or "moderate"
    goal_type = overrides.get("goal_type") or map_profile_goal_type(profile.goal_type)
    experience = overrides.get("experience_level") or profile.experience_level or "beginner"
    target = overrides.get("target_weight_kg") or decimal_to_float(profile.target_weight)

    calorie_adj = overrides.get("calorie_adjustment")
    if calorie_adj is None:
        if goal_type == "fat_loss" and profile.calorie_deficit:
            calorie_adj = profile.calorie_deficit
        elif goal_type == "muscle_gain" and profile.calorie_surplus:
            calorie_adj = profile.calorie_surplus

    return GoalInput(
        age=int(age),
        gender=gender,
        height_cm=float(height),
        weight_kg=float(weight),
        target_weight_kg=float(target) if target else None,
        activity_level=activity,
        goal_type=goal_type,
        experience_level=experience,
        calorie_adjustment=calorie_adj,
    )


def get_nutrition_summary(user, start_date: date, end_date: date) -> dict[str, Any]:
    logs = FoodLogEntry.objects.filter(user=user, logged_date__range=(start_date, end_date))

    daily = (
        logs.values("logged_date")
        .annotate(
            calories=Sum("calories"),
            protein=Sum("protein"),
            carbs=Sum("carbs"),
            fat=Sum("fat"),
            meal_count=Count("id"),
        )
        .order_by("logged_date")
    )

    totals = logs.aggregate(
        calories=Sum("calories"),
        protein=Sum("protein"),
        carbs=Sum("carbs"),
        fat=Sum("fat"),
    )

    return {
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "daily": [
            {
                "date": row["logged_date"].isoformat(),
                "calories": float(row["calories"] or 0),
                "protein": float(row["protein"] or 0),
                "carbs": float(row["carbs"] or 0),
                "fat": float(row["fat"] or 0),
                "meal_count": row["meal_count"],
            }
            for row in daily
        ],
        "totals": {k: float(v or 0) for k, v in totals.items()},
        "days_logged": daily.count(),
    }


def get_fitness_progress(user) -> dict[str, Any]:
    profile = user.profile
    goal_input = build_goal_input_from_profile(profile)
    goal_estimate = None
    if goal_input:
        est = estimate_goal(goal_input)
        goal_estimate = {
            "calorie_target": est.calorie_target,
            "macro_breakdown": {
                "protein_g": est.macro_breakdown.protein_g,
                "fat_g": est.macro_breakdown.fat_g,
                "carbs_g": est.macro_breakdown.carbs_g,
            },
            "estimated_completion_date": est.estimated_completion_date,
            "confidence_score": est.confidence_score,
            "weekly_projection": [
                {"week": p.week, "weight_kg": p.projected_weight_kg, "date": p.date}
                for p in est.weekly_weight_projection
            ],
        }

    end = date.today()
    start = end - timedelta(days=30)
    nutrition = get_nutrition_summary(user, start, end)

    workouts = WorkoutSession.objects.filter(user=user, workout_date__range=(start, end))
    workout_count = workouts.count()

    body_weights = (
        workouts.exclude(body_weight_kg__isnull=True)
        .annotate(day=TruncDate("workout_date"))
        .values("day")
        .annotate(avg_weight=Avg("body_weight_kg"))
        .order_by("day")
    )

    latest_plan = GeneratedWorkoutPlan.objects.filter(user=user, is_active=True).first()

    return {
        "goal_estimate": goal_estimate,
        "nutrition_30d": nutrition,
        "workouts_30d": workout_count,
        "body_weight_trend": [
            {"date": row["day"].isoformat(), "weight_kg": float(row["avg_weight"])}
            for row in body_weights
        ],
        "active_workout_plan_id": str(latest_plan.id) if latest_plan else None,
    }
