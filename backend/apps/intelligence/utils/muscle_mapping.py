"""Structured anatomy intelligence — maps muscles to regions and movement patterns."""

from typing import TypedDict


class MuscleRegion(TypedDict):
    group: str
    sub_regions: list[str]


MUSCLE_ANATOMY: dict[str, MuscleRegion] = {
    "chest": {"group": "chest", "sub_regions": ["upper", "mid", "lower"]},
    "back": {"group": "back", "sub_regions": ["lats", "traps", "rhomboids"]},
    "legs": {"group": "legs", "sub_regions": ["quads", "hamstrings", "glutes", "calves"]},
    "shoulders": {"group": "shoulders", "sub_regions": ["front_delts", "lateral_delts", "rear_delts"]},
    "arms": {"group": "arms", "sub_regions": ["biceps", "triceps"]},
}

# API Ninjas muscle names → our anatomy sub-regions
NINJAS_MUSCLE_MAP: dict[str, tuple[str, str | None]] = {
    "abdominals": ("core", None),
    "abductors": ("legs", "glutes"),
    "adductors": ("legs", "quads"),
    "biceps": ("arms", "biceps"),
    "calves": ("legs", "calves"),
    "chest": ("chest", "mid"),
    "forearms": ("arms", "biceps"),
    "glutes": ("legs", "glutes"),
    "hamstrings": ("legs", "hamstrings"),
    "lats": ("back", "lats"),
    "lower_back": ("back", "rhomboids"),
    "middle_back": ("back", "rhomboids"),
    "neck": ("back", "traps"),
    "quadriceps": ("legs", "quads"),
    "shoulders": ("shoulders", "front_delts"),
    "traps": ("back", "traps"),
    "triceps": ("arms", "triceps"),
}

MOVEMENT_PATTERNS = ("push", "pull", "hinge", "squat", "carry", "core")

# Infer movement pattern from muscle + exercise type
MUSCLE_TO_PATTERN: dict[str, str] = {
    "chest": "push",
    "shoulders": "push",
    "triceps": "push",
    "lats": "pull",
    "middle_back": "pull",
    "biceps": "pull",
    "traps": "pull",
    "hamstrings": "hinge",
    "glutes": "hinge",
    "lower_back": "hinge",
    "quadriceps": "squat",
    "calves": "squat",
    "abdominals": "core",
    "forearms": "pull",
}


def map_ninjas_muscle(muscle: str) -> dict[str, str | None]:
    group, sub = NINJAS_MUSCLE_MAP.get(muscle.lower(), (muscle, None))
    return {"primary_group": group, "sub_region": sub}


def infer_movement_pattern(muscle: str, exercise_type: str) -> str:
    if exercise_type == "cardio":
        return "carry"
    if exercise_type == "stretching":
        return "core"
    return MUSCLE_TO_PATTERN.get(muscle.lower(), "push")
