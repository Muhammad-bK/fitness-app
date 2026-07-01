"""Goal estimation engine — exact Mifflin-St Jeor formulas."""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Literal

ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]
GoalType = Literal["fat_loss", "muscle_gain", "maintenance"]
ExperienceLevel = Literal["beginner", "intermediate", "advanced"]
Gender = Literal["male", "female"]

ACTIVITY_MULTIPLIERS: dict[ActivityLevel, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

DEFICIT_OPTIONS = (250, 500, 750)
KCAL_PER_KG_FAT = 7700

# Muscle gain rates kg/month by experience
MUSCLE_GAIN_RATES: dict[ExperienceLevel, tuple[float, float]] = {
    "beginner": (0.75, 1.0),
    "intermediate": (0.25, 0.5),
    "advanced": (0.1, 0.25),
}

# Protein g/kg ranges by goal
PROTEIN_RANGES: dict[GoalType, tuple[float, float]] = {
    "fat_loss": (1.6, 2.4),
    "muscle_gain": (1.6, 2.2),
    "maintenance": (1.2, 1.8),
}

FAT_CALORIE_RATIO = (0.20, 0.35)


@dataclass
class GoalInput:
    age: int
    gender: Gender
    height_cm: float
    weight_kg: float
    target_weight_kg: float | None
    activity_level: ActivityLevel
    goal_type: GoalType
    experience_level: ExperienceLevel
    calorie_adjustment: int | None = None  # deficit or surplus kcal


@dataclass
class WeeklyProjection:
    week: int
    projected_weight_kg: float
    date: str


@dataclass
class MacroBreakdown:
    protein_g: float
    fat_g: float
    carbs_g: float
    protein_pct: float
    fat_pct: float
    carbs_pct: float


@dataclass
class GoalEstimate:
    bmr: float
    tdee: float
    calorie_target: float
    calorie_adjustment: int
    macro_breakdown: MacroBreakdown
    estimated_completion_date: str | None
    weeks_needed: float | None
    weekly_weight_projection: list[WeeklyProjection]
    weekly_loss_kg: float | None
    weekly_gain_kg: float | None
    confidence_score: float


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: Gender) -> float:
    """Mifflin-St Jeor BMR."""
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if gender == "male":
        return base + 5
    return base - 161


def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[activity_level]


def calculate_macros(calorie_target: float, weight_kg: float, goal_type: GoalType) -> MacroBreakdown:
    protein_lo, protein_hi = PROTEIN_RANGES[goal_type]
    protein_g = round(weight_kg * ((protein_lo + protein_hi) / 2), 1)

    fat_lo, fat_hi = FAT_CALORIE_RATIO
    fat_ratio = (fat_lo + fat_hi) / 2
    fat_g = round((calorie_target * fat_ratio) / 9, 1)

    protein_cal = protein_g * 4
    fat_cal = fat_g * 9
    carbs_g = round(max(0, (calorie_target - protein_cal - fat_cal) / 4), 1)

    total_cal = protein_cal + fat_cal + (carbs_g * 4)
    return MacroBreakdown(
        protein_g=protein_g,
        fat_g=fat_g,
        carbs_g=carbs_g,
        protein_pct=round(protein_cal / total_cal * 100, 1) if total_cal else 0,
        fat_pct=round(fat_cal / total_cal * 100, 1) if total_cal else 0,
        carbs_pct=round(carbs_g * 4 / total_cal * 100, 1) if total_cal else 0,
    )


def calculate_confidence(goal_type: GoalType, experience_level: ExperienceLevel, activity_level: ActivityLevel) -> float:
    """Confidence based on adherence assumptions (0-100)."""
    base = 75.0
    if activity_level in ("active", "very_active"):
        base += 5
    if experience_level == "beginner" and goal_type == "muscle_gain":
        base += 10
    if experience_level == "advanced" and goal_type == "fat_loss":
        base += 5
    if goal_type == "maintenance":
        base += 10
    return min(95.0, base)


def estimate_goal(inp: GoalInput) -> GoalEstimate:
    bmr = calculate_bmr(inp.weight_kg, inp.height_cm, inp.age, inp.gender)
    tdee = calculate_tdee(bmr, inp.activity_level)

    if inp.goal_type == "fat_loss":
        adjustment = inp.calorie_adjustment or 500
        if adjustment not in DEFICIT_OPTIONS:
            adjustment = min(DEFICIT_OPTIONS, key=lambda x: abs(x - adjustment))
        calorie_target = tdee - adjustment
        weekly_loss = (adjustment * 7) / KCAL_PER_KG_FAT
        weekly_gain = None
    elif inp.goal_type == "muscle_gain":
        adjustment = inp.calorie_adjustment or 300
        adjustment = max(200, min(500, adjustment))
        calorie_target = tdee + adjustment
        weekly_loss = None
        lo, hi = MUSCLE_GAIN_RATES[inp.experience_level]
        weekly_gain = ((lo + hi) / 2) / 4.33  # kg/week from kg/month
    else:
        adjustment = 0
        calorie_target = tdee
        weekly_loss = None
        weekly_gain = None

    macros = calculate_macros(calorie_target, inp.weight_kg, inp.goal_type)
    confidence = calculate_confidence(inp.goal_type, inp.experience_level, inp.activity_level)

    weeks_needed: float | None = None
    completion_date: str | None = None
    projections: list[WeeklyProjection] = []
    today = date.today()

    if inp.target_weight_kg is not None and inp.target_weight_kg != inp.weight_kg:
        delta = abs(inp.weight_kg - inp.target_weight_kg)

        if inp.goal_type == "fat_loss" and weekly_loss and weekly_loss > 0:
            weeks_needed = round(delta / weekly_loss, 1)
            rate = -weekly_loss
        elif inp.goal_type == "muscle_gain" and weekly_gain and weekly_gain > 0:
            weeks_needed = round(delta / weekly_gain, 1)
            rate = weekly_gain
        else:
            rate = 0
            weeks_needed = None

        if weeks_needed:
            completion_date = (today + timedelta(weeks=int(weeks_needed))).isoformat()
            max_weeks = min(int(weeks_needed) + 1, 52)
            for w in range(max_weeks + 1):
                projected = inp.weight_kg + (rate * w)
                projections.append(
                    WeeklyProjection(
                        week=w,
                        projected_weight_kg=round(projected, 2),
                        date=(today + timedelta(weeks=w)).isoformat(),
                    )
                )
    else:
        for w in range(13):
            projections.append(
                WeeklyProjection(week=w, projected_weight_kg=inp.weight_kg, date=(today + timedelta(weeks=w)).isoformat())
            )

    return GoalEstimate(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        calorie_target=round(calorie_target, 1),
        calorie_adjustment=adjustment,
        macro_breakdown=macros,
        estimated_completion_date=completion_date,
        weeks_needed=weeks_needed,
        weekly_weight_projection=projections,
        weekly_loss_kg=round(weekly_loss, 3) if weekly_loss else None,
        weekly_gain_kg=round(weekly_gain, 3) if weekly_gain else None,
        confidence_score=confidence,
    )


def age_from_dob(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def map_profile_goal_type(goal_type: str | None) -> GoalType:
    mapping = {
        "lose_weight": "fat_loss",
        "build_muscle": "muscle_gain",
        "maintain_weight": "maintenance",
        "improve_fitness": "maintenance",
    }
    return mapping.get(goal_type or "", "maintenance")  # type: ignore[return-value]


def decimal_to_float(val: Decimal | float | None) -> float | None:
    if val is None:
        return None
    return float(val)
