from datetime import date

from apps.intelligence.integrations.usda import get_food_detail, scale_nutrients
from apps.intelligence.models import FoodLogEntry


def create_food_log(user, data: dict) -> FoodLogEntry:
    fdc_id = data["fdc_id"]
    grams = float(data["grams"])
    food = get_food_detail(fdc_id)
    scaled = scale_nutrients(food, grams)

    return FoodLogEntry.objects.create(
        user=user,
        fdc_id=fdc_id,
        food_name=data.get("food_name") or food["name"],
        grams=grams,
        meal_type=data.get("meal_type", "lunch"),
        logged_date=data.get("logged_date") or date.today(),
        calories=scaled["calories"],
        protein=scaled["protein"],
        carbs=scaled["carbs"],
        fat=scaled["fat"],
        fiber=scaled.get("fiber", 0),
        sugar=scaled.get("sugar", 0),
        nutrients={
            "vitamins": scaled.get("vitamins", {}),
            "minerals": scaled.get("minerals", {}),
        },
    )


def get_daily_logs(user, log_date: date) -> list[FoodLogEntry]:
    return list(FoodLogEntry.objects.filter(user=user, logged_date=log_date).order_by("created_at"))
