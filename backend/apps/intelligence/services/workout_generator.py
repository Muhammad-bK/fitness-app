"""Workout generation engine with split logic and progressive overload rules."""

import random
from dataclasses import dataclass
from datetime import date
from typing import Any, Literal

from apps.intelligence.integrations import api_ninjas
from apps.intelligence.services.goal_engine import ExperienceLevel, GoalType

SplitType = Literal["push_pull_legs", "upper_lower", "full_body"]
TrainingStyle = Literal["strength", "hypertrophy", "endurance"]

TRAINING_PARAMS: dict[TrainingStyle, dict[str, Any]] = {
    "strength": {"sets": (3, 6), "reps": (1, 5), "rest_seconds": 180},
    "hypertrophy": {"sets": (3, 5), "reps": (6, 12), "rest_seconds": 90},
    "endurance": {"sets": (2, 4), "reps": (12, 20), "rest_seconds": 60},
}

SPLIT_MUSCLES: dict[SplitType, list[dict[str, Any]]] = {
    "push_pull_legs": [
        {"day": "push", "muscles": ["chest", "shoulders", "triceps"], "label": "Push"},
        {"day": "pull", "muscles": ["lats", "middle_back", "biceps", "traps"], "label": "Pull"},
        {"day": "legs", "muscles": ["quadriceps", "hamstrings", "glutes", "calves"], "label": "Legs"},
    ],
    "upper_lower": [
        {"day": "upper", "muscles": ["chest", "lats", "shoulders", "biceps", "triceps"], "label": "Upper"},
        {"day": "lower", "muscles": ["quadriceps", "hamstrings", "glutes", "calves"], "label": "Lower"},
    ],
    "full_body": [
        {"day": "full", "muscles": ["chest", "lats", "quadriceps", "shoulders", "hamstrings"], "label": "Full Body"},
    ],
}

PROGRESSIVE_OVERLOAD = {
    "upper_body_pct": (0.025, 0.05),
    "lower_body_pct": (0.05, 0.10),
}

UPPER_BODY_MUSCLES = {"chest", "shoulders", "triceps", "biceps", "lats", "middle_back", "traps", "forearms"}


@dataclass
class WorkoutGenerationInput:
    goal_type: GoalType
    experience_level: ExperienceLevel
    workouts_per_week: int
    split: SplitType | None = None


def select_split(workouts_per_week: int) -> SplitType:
    if workouts_per_week >= 5:
        return "push_pull_legs"
    if workouts_per_week >= 3:
        return "upper_lower"
    return "full_body"


def select_training_style(goal_type: GoalType, experience_level: ExperienceLevel) -> TrainingStyle:
    if goal_type == "muscle_gain":
        return "hypertrophy"
    if goal_type == "fat_loss":
        return "endurance" if experience_level == "beginner" else "hypertrophy"
    if experience_level == "advanced":
        return "strength"
    return "hypertrophy"


def _pick_exercises_for_muscle(muscle: str, difficulty: str, count: int = 2) -> list[dict]:
    try:
        exercises = api_ninjas.search_exercises(muscle=muscle, difficulty=difficulty)
    except Exception:
        exercises = []
    if not exercises:
        return [{
            "name": f"{muscle.title()} Exercise",
            "type": "strength",
            "primary_muscle": muscle,
            "equipment": "body weight",
            "difficulty": difficulty,
            "instructions": "Perform controlled reps.",
            "movement_pattern": "push",
        }]
    return exercises[:count]


def _build_exercise_prescription(exercise: dict, style: TrainingStyle) -> dict:
    params = TRAINING_PARAMS[style]
    sets = random.randint(*params["sets"])
    reps = random.randint(*params["reps"])
    return {
        **exercise,
        "sets": sets,
        "reps": reps,
        "rest_seconds": params["rest_seconds"],
        "training_style": style,
    }


def generate_workout_plan(inp: WorkoutGenerationInput) -> dict[str, Any]:
    split = inp.split or select_split(inp.workouts_per_week)
    style = select_training_style(inp.goal_type, inp.experience_level)
    difficulty = inp.experience_level

    split_days = SPLIT_MUSCLES[split]
    schedule: list[dict] = []

    for i, day_config in enumerate(split_days):
        if i >= inp.workouts_per_week:
            break
        exercises = []
        for muscle in day_config["muscles"][:3]:
            for ex in _pick_exercises_for_muscle(muscle, difficulty, count=1):
                exercises.append(_build_exercise_prescription(ex, style))

        schedule.append({
            "day_index": i,
            "day_label": day_config["label"],
            "focus_muscles": day_config["muscles"],
            "exercises": exercises,
        })

    return {
        "split": split,
        "training_style": style,
        "workouts_per_week": inp.workouts_per_week,
        "schedule": schedule,
        "progressive_overload": {
            "upper_body_increase_pct": PROGRESSIVE_OVERLOAD["upper_body_pct"],
            "lower_body_increase_pct": PROGRESSIVE_OVERLOAD["lower_body_pct"],
            "rule": "When max reps achieved, increase weight by recommended percentage.",
        },
    }


def get_today_workout(plan: dict[str, Any], workout_date: date | None = None) -> dict[str, Any] | None:
    """Return today's workout from a generated plan based on day-of-week rotation."""
    workout_date = workout_date or date.today()
    schedule = plan.get("schedule", [])
    if not schedule:
        return None
    day_index = workout_date.weekday() % len(schedule)
    today = schedule[day_index]
    return {
        "date": workout_date.isoformat(),
        "day_label": today["day_label"],
        "focus_muscles": today["focus_muscles"],
        "exercises": today["exercises"],
    }


def calculate_weight_increase(muscle: str, current_weight_kg: float) -> float:
    if muscle.lower() in UPPER_BODY_MUSCLES:
        lo, hi = PROGRESSIVE_OVERLOAD["upper_body_pct"]
    else:
        lo, hi = PROGRESSIVE_OVERLOAD["lower_body_pct"]
    pct = (lo + hi) / 2
    return round(current_weight_kg * (1 + pct), 2)
