"""API Ninjas exercise catalog integration."""

from typing import Any

from django.conf import settings

from apps.intelligence.integrations.http_client import ExternalAPIError, request_with_retry
from apps.intelligence.utils.cache import SEARCH_TTL, cache_or_fetch
from apps.intelligence.utils.muscle_mapping import infer_movement_pattern, map_ninjas_muscle

BASE_URL = "https://api.api-ninjas.com/v1/exercises"


def _api_key() -> str:
    key = getattr(settings, "API_NINJAS_KEY", "")
    if not key:
        raise ExternalAPIError("API_NINJAS_KEY is not configured", status_code=503)
    return key


def _headers() -> dict[str, str]:
    return {"X-Api-Key": _api_key()}


def search_exercises(
    *,
    muscle: str | None = None,
    difficulty: str | None = None,
    exercise_type: str | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {}
    if muscle:
        params["muscle"] = muscle
    if difficulty:
        params["difficulty"] = difficulty
    if exercise_type:
        params["type"] = exercise_type

    def fetch():
        data = request_with_retry("GET", BASE_URL, headers=_headers(), params=params)
        if not isinstance(data, list):
            return []
        return [normalize_exercise(ex) for ex in data]

    return cache_or_fetch("ninjas_exercises", SEARCH_TTL, fetch, muscle, difficulty, exercise_type)


def normalize_exercise(raw: dict) -> dict[str, Any]:
    muscle = raw.get("muscle", "")
    ex_type = raw.get("type", "strength")
    anatomy = map_ninjas_muscle(muscle)
    secondary = [s.strip() for s in raw.get("secondary_muscles", []) if s]

    return {
        "name": raw.get("name", ""),
        "type": ex_type,
        "primary_muscle": muscle,
        "primary_muscle_group": anatomy["primary_group"],
        "sub_region": anatomy["sub_region"],
        "secondary_muscles": secondary,
        "equipment": raw.get("equipment", ""),
        "difficulty": raw.get("difficulty", "beginner"),
        "instructions": raw.get("instructions", ""),
        "movement_pattern": infer_movement_pattern(muscle, ex_type),
    }
