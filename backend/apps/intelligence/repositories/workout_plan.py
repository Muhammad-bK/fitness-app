from apps.intelligence.models import GeneratedWorkoutPlan
from apps.intelligence.services.workout_generator import generate_workout_plan, get_today_workout


def save_workout_plan(user, plan_data: dict) -> GeneratedWorkoutPlan:
    GeneratedWorkoutPlan.objects.filter(user=user, is_active=True).update(is_active=False)
    return GeneratedWorkoutPlan.objects.create(
        user=user,
        plan_data=plan_data,
        split=plan_data["split"],
        training_style=plan_data["training_style"],
        workouts_per_week=plan_data["workouts_per_week"],
        is_active=True,
    )


def get_active_plan(user) -> GeneratedWorkoutPlan | None:
    return GeneratedWorkoutPlan.objects.filter(user=user, is_active=True).first()


def get_today_workout_for_user(user) -> dict | None:
    plan = get_active_plan(user)
    if not plan:
        return None
    return get_today_workout(plan.plan_data)
