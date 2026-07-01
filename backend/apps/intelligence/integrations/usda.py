"""USDA FoodData Central API integration."""

import logging
from typing import Any

from django.conf import settings

from apps.intelligence.integrations.http_client import ExternalAPIError, request_with_retry
from apps.intelligence.utils.cache import SEARCH_TTL, cache_or_fetch

logger = logging.getLogger(__name__)

BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# USDA nutrient IDs
NUTRIENT_IDS = {
    "calories": 1008,
    "protein": 1003,
    "carbs": 1005,
    "fat": 1004,
    "fiber": 1079,
    "sugar": 2000,
    "vitamin_a": 1106,
    "vitamin_b": 1165,  # B6 as representative
    "vitamin_c": 1162,
    "vitamin_d": 1114,
    "vitamin_e": 1109,
    "vitamin_k": 1185,
    "calcium": 1087,
    "iron": 1089,
    "magnesium": 1090,
    "potassium": 1092,
    "zinc": 1095,
    "sodium": 1093,
}


def _api_key() -> str:
    key = getattr(settings, "USDA_API_KEY", "")
    if not key:
        raise ExternalAPIError("USDA_API_KEY is not configured", status_code=503)
    return key


def search_foods(query: str, page_size: int = 25) -> list[dict[str, Any]]:
    def fetch():
        data = request_with_retry(
            "GET",
            f"{BASE_URL}/foods/search",
            params={
                "api_key": _api_key(),
                "query": query,
                "pageSize": page_size,
                "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
            },
        )
        foods = data.get("foods", [])
        return [normalize_food_summary(f) for f in foods]

    return cache_or_fetch("usda_search", SEARCH_TTL, fetch, query, page_size)


def get_food_detail(fdc_id: int) -> dict[str, Any]:
    def fetch():
        data = request_with_retry(
            "GET",
            f"{BASE_URL}/food/{fdc_id}",
            params={"api_key": _api_key()},
        )
        return normalize_food_detail(data)

    return cache_or_fetch("usda_food", SEARCH_TTL, fetch, fdc_id)


def _extract_nutrient(nutrients: list[dict], nutrient_id: int) -> float:
    for n in nutrients:
        if n.get("nutrient", {}).get("id") == nutrient_id or n.get("nutrientId") == nutrient_id:
            return float(n.get("amount", 0) or 0)
    return 0.0


def _normalize_nutrients(raw_nutrients: list[dict]) -> dict[str, float]:
    return {
        "calories": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["calories"]),
        "protein": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["protein"]),
        "carbs": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["carbs"]),
        "fat": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["fat"]),
        "fiber": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["fiber"]),
        "sugar": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["sugar"]),
        "vitamins": {
            "a": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_a"]),
            "b": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_b"]),
            "c": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_c"]),
            "d": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_d"]),
            "e": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_e"]),
            "k": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["vitamin_k"]),
        },
        "minerals": {
            "calcium": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["calcium"]),
            "iron": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["iron"]),
            "magnesium": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["magnesium"]),
            "potassium": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["potassium"]),
            "zinc": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["zinc"]),
            "sodium": _extract_nutrient(raw_nutrients, NUTRIENT_IDS["sodium"]),
        },
    }


def normalize_food_summary(food: dict) -> dict[str, Any]:
    nutrients = food.get("foodNutrients", [])
    normalized = _normalize_nutrients(nutrients)
    return {
        "fdc_id": food.get("fdcId"),
        "name": food.get("description", ""),
        "brand": food.get("brandOwner"),
        "serving_size_g": 100,
        **normalized,
    }


def normalize_food_detail(food: dict) -> dict[str, Any]:
    nutrients = food.get("foodNutrients", [])
    normalized = _normalize_nutrients(nutrients)
    return {
        "fdc_id": food.get("fdcId"),
        "name": food.get("description", ""),
        "brand": food.get("brandOwner"),
        "serving_size_g": 100,
        "ingredients": food.get("ingredients"),
        **normalized,
    }


def scale_nutrients(nutrients_per_100g: dict[str, Any], grams: float) -> dict[str, Any]:
    """calories = (grams / 100) × calories_per_100g"""
    factor = grams / 100.0
    scaled = {
        "calories": round(nutrients_per_100g["calories"] * factor, 1),
        "protein": round(nutrients_per_100g["protein"] * factor, 1),
        "carbs": round(nutrients_per_100g["carbs"] * factor, 1),
        "fat": round(nutrients_per_100g["fat"] * factor, 1),
        "fiber": round(nutrients_per_100g.get("fiber", 0) * factor, 1),
        "sugar": round(nutrients_per_100g.get("sugar", 0) * factor, 1),
        "vitamins": {k: round(v * factor, 2) for k, v in nutrients_per_100g.get("vitamins", {}).items()},
        "minerals": {k: round(v * factor, 2) for k, v in nutrients_per_100g.get("minerals", {}).items()},
    }
    return scaled
