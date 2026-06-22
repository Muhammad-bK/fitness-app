"""Pure functions for unit conversion, 1RM estimation, and volume calculation."""

from decimal import Decimal

LBS_PER_KG = Decimal("2.2046226218")


def lbs_to_kg(lbs: Decimal) -> Decimal:
    return (lbs / LBS_PER_KG).quantize(Decimal("0.01"))


def kg_to_lbs(kg: Decimal) -> Decimal:
    return (kg * LBS_PER_KG).quantize(Decimal("0.01"))


def display_weight(value_kg: Decimal, unit_preference: str) -> Decimal:
    if unit_preference == "lbs":
        return kg_to_lbs(value_kg)
    return value_kg


def convert_to_kg(weight: Decimal, unit: str) -> Decimal:
    """Convert weight from the given unit to kilograms for storage."""
    if unit == "lbs":
        return lbs_to_kg(weight)
    return weight


def estimate_one_rep_max(weight_kg: Decimal, reps: int) -> Decimal:
    """Epley formula: 1RM = weight × (1 + reps/30)."""
    if reps <= 0 or weight_kg is None or weight_kg <= 0:
        return Decimal("0")
    if reps == 1:
        return weight_kg
    return (weight_kg * (1 + Decimal(reps) / 30)).quantize(Decimal("0.01"))


def calculate_set_volume(weight_kg: Decimal | None, reps: int) -> Decimal:
    if weight_kg is None or weight_kg <= 0:
        return Decimal("0")
    return (weight_kg * reps).quantize(Decimal("0.01"))


def format_rest_time(seconds: int | None) -> str:
    if seconds is None or seconds <= 0:
        return ""
    minutes = seconds // 60
    secs = seconds % 60
    if minutes and secs:
        return f"{minutes}m {secs}s"
    if minutes:
        return f"{minutes}m"
    return f"{secs}s"
