# workouts

Core workout logging. Handles creation, retrieval, update, and deletion of workout sessions with nested exercises and sets. All operations are scoped to the authenticated user.

## Data Model (3 levels of nesting)

```
WorkoutSession (1 per gym visit)
  └── WorkoutExercise (1 per exercise performed)
        └── ExerciseSet (1 per set logged)
```

## Files

### models.py
Three models forming a nested hierarchy:

- **WorkoutSession**: UUID pk, FK to User, session_name, body_weight_kg (stored in kg), body_weight_unit (snapshot of what unit the user entered), workout_date, notes, started_at, ended_at, created_at.
  - DB table: `workout_sessions`. Index on `(user, workout_date)`.
  - Depends on: `settings.AUTH_USER_MODEL` (accounts app).

- **WorkoutExercise**: UUID pk, FK to WorkoutSession (CASCADE), FK to Exercise (PROTECT), order_in_session, notes, created_at.
  - DB table: `workout_exercises`. Indexes on `workout_session`, `exercise`.
  - Depends on: `exercises.Exercise` model.

- **ExerciseSet**: UUID pk, FK to WorkoutExercise (CASCADE), set_number, set_type (working/warmup/dropset/failure), weight_kg (stored in kg), weight_unit (snapshot), reps, rest_time_seconds, had_spotter, paused, pause_at_rep, notes, created_at.
  - DB table: `exercise_sets`. Index on `workout_exercise`.

### serializers.py
Two serializer families — read and write — because the API accepts flat exercise/set data on write but returns nested objects with computed fields on read.

**Read serializers** (for GET responses):
- **ExerciseSetReadSerializer**: Includes `display_weight` computed field that converts kg to the user's preferred unit.
- **WorkoutExerciseReadSerializer**: Nests ExerciseSerializer (from exercises app) and ExerciseSetReadSerializer.
- **WorkoutSessionReadSerializer**: Full nested response with all exercises and sets. Includes `display_body_weight`.
- **WorkoutSessionListSerializer**: Lightweight list view — no nested exercises/sets, but includes annotated `exercise_count` and `set_count`.

**Write serializers** (for POST/PUT/PATCH):
- **ExerciseSetWriteSerializer**: Accepts `weight` + `weight_unit` (not `weight_kg`). Validates that weight_unit is required when weight is provided.
- **WorkoutExerciseWriteSerializer**: Accepts `exercise_id` (UUID) + nested `sets` array. Validates at least one set is required.
- **WorkoutSessionWriteSerializer**: Accepts the full workout in one request. On `create()`:
  1. Validates all exercise_ids are accessible (global or user's custom).
  2. Converts body_weight and set weights from entered unit to kg using `utils.convert_to_kg()`.
  3. Creates WorkoutSession, WorkoutExercise, and ExerciseSet objects.
  4. Sets are bulk-created for performance.
  On `update()`: Uses a replace strategy — deletes all existing WorkoutExercise/ExerciseSet rows and recreates them.

- Depends on: `models.py`, `utils.py`, `exercises.models.Exercise`, `exercises.serializers.ExerciseSerializer`.

### views.py
- **WorkoutSessionViewSet**: Full ModelViewSet. All queries are scoped to `user=request.user`.
  - `list`: Annotates exercise_count and set_count, uses WorkoutSessionListSerializer.
  - `retrieve`: Prefetches workout_exercises + exercise + sets, uses WorkoutSessionReadSerializer.
  - `create`/`update`: Uses WorkoutSessionWriteSerializer for input, returns WorkoutSessionReadSerializer response.
  - Supports `?start=` and `?end=` date range filtering.
- Depends on: `models.py`, `serializers.py`.

### urls.py
Uses DRF `DefaultRouter`. Mounted at `/api/workouts/` in `backend/config/urls.py`.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/workouts/` | List sessions (paginated, lightweight) |
| POST | `/api/workouts/` | Create full workout (nested) |
| GET | `/api/workouts/{id}/` | Retrieve with all exercises & sets |
| PUT | `/api/workouts/{id}/` | Full replace |
| PATCH | `/api/workouts/{id}/` | Partial update |
| DELETE | `/api/workouts/{id}/` | Delete (cascades to exercises & sets) |

### utils.py
Pure functions used by serializers and analytics:
- `lbs_to_kg(lbs)` / `kg_to_lbs(kg)`: Unit conversion using `Decimal("2.2046226218")`.
- `convert_to_kg(weight, unit)`: Converts to kg for DB storage.
- `display_weight(value_kg, unit_preference)`: Converts stored kg to display unit.
- `estimate_one_rep_max(weight_kg, reps)`: Epley formula — `weight * (1 + reps/30)`.
- `calculate_set_volume(weight_kg, reps)`: Simple `weight * reps`.
- `format_rest_time(seconds)`: Formats seconds to "2m 30s" style string.

Used by: `serializers.py` (this app), `analytics/views.py`.

### admin.py
Django admin with inline editing:
- WorkoutSessionAdmin: Shows WorkoutExercise inline.
- WorkoutExerciseAdmin: Shows ExerciseSet inline.
- ExerciseSetAdmin: Standalone admin view.

### management/commands/create_demo_data.py
Management command: `python manage.py create_demo_data [--email demo@example.com] [--weeks 12]`

Generates realistic workout data with progressive overload for a PPL (Push/Pull/Legs) split over configurable weeks. Creates ~3-4 sessions per week with warmup + working sets and gradual weight increases.

Depends on: User model, Exercise model, all workout models. Requires `seed_exercises` to be run first.

## Key Behaviors
- All weights are stored internally in kilograms regardless of what unit the user enters.
- The `weight_unit` field on ExerciseSet and `body_weight_unit` on WorkoutSession snapshot what unit the user originally entered in, enabling accurate display without data loss.
- Deleting a WorkoutSession cascades to WorkoutExercise and ExerciseSet (CASCADE FK).
- Deleting an Exercise that has been used in workouts is blocked (PROTECT FK).
