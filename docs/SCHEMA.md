# Database Schema

## Weight Storage Rule

**All weights are stored internally in kilograms.** Conversion to the user's preferred unit happens only at display time in the frontend `lib/units.ts` and backend `utils.py`.

Each weight field has a companion `*_unit` snapshot field that records what unit the user originally entered. This prevents silent re-conversion if a user changes their preference — historical data always displays accurately.

## Tables

### users
Custom Django user model. Email is the login identifier.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | varchar, unique | USERNAME_FIELD |
| password | varchar | Django-managed hash |
| display_name | varchar, nullable | |
| unit_preference | enum(kg, lbs), default kg | Display preference |
| is_active | bool | |
| is_staff | bool | |
| created_at | timestamp | |
| updated_at | timestamp | |

### exercises
Global exercise library + user-created custom exercises.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| muscle_group | varchar, nullable | Validated at app layer, not DB enum |
| category | enum(barbell, dumbbell, cable, machine, bodyweight, other) | |
| is_global | bool, default false | |
| created_by | FK → users, nullable | NULL for global exercises |
| created_at | timestamp | |

**Rules:**
- Global: `is_global=true`, `created_by=NULL`
- Custom: `is_global=false`, `created_by=<user>`
- User sees all global + their own customs
- Cannot edit/delete global exercises

### workout_sessions

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users | |
| session_name | varchar | e.g. "Push Day" |
| body_weight_kg | decimal(5,2), nullable | Stored in kg |
| body_weight_unit | enum(kg, lbs), nullable | Unit snapshot |
| workout_date | date | Calendar date, not timestamp |
| notes | text, nullable | |
| started_at | timestamp, nullable | |
| ended_at | timestamp, nullable | |
| created_at | timestamp | |

### workout_exercises
Bridge table: which exercises in what order within a session.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| workout_session_id | FK → workout_sessions | CASCADE delete |
| exercise_id | FK → exercises | PROTECT delete |
| order_in_session | integer | |
| notes | text, nullable | |
| created_at | timestamp | |

### exercise_sets
The atomic data — the most important table.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| workout_exercise_id | FK → workout_exercises | CASCADE delete |
| set_number | integer | |
| set_type | enum(working, warmup, dropset, failure) | |
| weight_kg | decimal(6,2), nullable | Stored in kg |
| weight_unit | enum(kg, lbs), nullable | Unit snapshot |
| reps | integer | |
| rest_time_seconds | integer, nullable | |
| had_spotter | bool, default false | |
| paused | bool, default false | |
| pause_at_rep | integer, nullable | |
| notes | text, nullable | |
| created_at | timestamp | |

## Relationships

```
users 1──* exercises          (created_by, nullable for globals)
users 1──* workout_sessions
workout_sessions 1──* workout_exercises   (CASCADE delete)
exercises 1──* workout_exercises          (PROTECT delete)
workout_exercises 1──* exercise_sets      (CASCADE delete)
```

## Indexes

- `exercise_sets(workout_exercise_id)`
- `workout_exercises(workout_session_id)`, `workout_exercises(exercise_id)`
- `workout_sessions(user_id, workout_date)` — composite, powers analytics queries
- `exercises(created_by)`, `exercises(is_global)`
