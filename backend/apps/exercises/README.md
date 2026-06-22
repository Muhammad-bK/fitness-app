# exercises

Exercise library management. Exercises can be global (available to all users, seeded via management command) or custom (created by individual users, visible only to them).

## Files

### models.py
- **Exercise**: UUID primary key, name, muscle_group (optional, freeform string), category (enum: barbell/dumbbell/cable/machine/bodyweight/other), is_global flag, created_by (FK to User, null for global exercises), created_at.
- `SUGGESTED_MUSCLE_GROUPS`: A list of recommended muscle group values (chest, back, shoulders, etc.) — not enforced at DB level.
- DB table: `exercises`
- Indexes on: `created_by`, `is_global`.
- Depends on: `settings.AUTH_USER_MODEL` (accounts app User).
- Referenced by: `WorkoutExercise.exercise` (workouts app) via `PROTECT` cascade.

### serializers.py
- **ExerciseSerializer**: ModelSerializer for CRUD. On create, automatically sets `created_by` to the request user and `is_global` to False (users cannot create global exercises via the API).
- Depends on: `models.py`.

### views.py
- **ExerciseViewSet**: Full ModelViewSet with queryset filtered to show global exercises + the authenticated user's custom exercises. Supports `?search=` (name icontains) and `?muscle_group=` query params.
- Depends on: `models.py`, `serializers.py`, `permissions.py`.

### permissions.py
- **ExercisePermission**: Custom DRF permission. Read access (GET/HEAD/OPTIONS) is allowed for all exercises visible to the user. Write access (PUT/PATCH/DELETE) is denied on global exercises and only allowed on the user's own custom exercises.

### urls.py
Uses DRF `DefaultRouter` to register the ExerciseViewSet. Mounted at `/api/exercises/` in `backend/config/urls.py`.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/exercises/` | List exercises (global + user's custom) |
| POST | `/api/exercises/` | Create custom exercise |
| GET | `/api/exercises/{id}/` | Retrieve exercise |
| PUT/PATCH | `/api/exercises/{id}/` | Update (own custom only) |
| DELETE | `/api/exercises/{id}/` | Delete (own custom only) |

### admin.py
Django admin registration with filters for category, is_global, and muscle_group.

### management/commands/seed_exercises.py
Management command: `python manage.py seed_exercises`

Seeds 16 standard global exercises (Bench Press, Squat, Deadlift, etc.) with predefined muscle groups and categories. Uses `get_or_create` so it's safe to run multiple times.

Depends on: `models.py`.

## Key Behaviors
- Global exercises cannot be modified or deleted by any user via the API.
- When an exercise is referenced in a WorkoutExercise, it uses `on_delete=PROTECT`, so deleting an exercise that has been used in a workout will fail.
- Custom exercises are only visible to their creator.
