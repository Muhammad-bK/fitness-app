# tests

Backend test suite using pytest + pytest-django + factory_boy. All tests use `@pytest.mark.django_db` for database access.

## Files

### conftest.py (in backend/, not tests/)
Root-level pytest fixtures:
- `api_client`: Fresh DRF `APIClient` instance.
- `authenticated_client`: APIClient with a factory-created user force-authenticated. The user is accessible via `authenticated_client.user`.

Depends on: `factories.py` (UserFactory via the `user_factory` fixture, which is defined per test module).

### factories.py
Factory Boy factories for generating test data:

| Factory | Model | Key defaults |
|---------|-------|-------------|
| `UserFactory` | accounts.User | Sequential email, "kg" unit_preference, password "testpass123" |
| `ExerciseFactory` | exercises.Exercise | Sequential name, is_global=True, category="barbell" |
| `WorkoutSessionFactory` | workouts.WorkoutSession | Random date, body_weight_kg=78.50 |
| `WorkoutExerciseFactory` | workouts.WorkoutExercise | order_in_session=1 |
| `ExerciseSetFactory` | workouts.ExerciseSet | weight_kg=80.00, reps=8, set_type="working" |
| `EquipmentFactory` | accounts.Equipment | Sequential name |
| `MuscleGroupFactory` | accounts.MuscleGroup | Sequential name |

Depends on: All app models (accounts.User/Equipment/MuscleGroup, exercises.Exercise, workouts.WorkoutSession/WorkoutExercise/ExerciseSet).

### test_auth.py
Tests for all `/api/auth/` endpoints:
- **TestRegister**: Success, duplicate email, short password.
- **TestLogin**: Success, wrong password.
- **TestLogout**: Blacklists refresh token, verifies it can't be reused; missing token returns 400.
- **TestMe**: Authenticated GET, unauthenticated 401, PATCH update.

Depends on: `factories.UserFactory`, conftest fixtures.

### test_exercises.py
Tests for `/api/exercises/` endpoints:
- **TestExerciseList**: Lists global + user's custom (not other users'), search filter, muscle_group filter, unauthenticated 401.
- **TestExerciseCreate**: Creates custom exercise, verifies is_global=False and created_by is set.
- **TestExercisePermissions**: Cannot edit/delete global exercises (403), can edit own custom, cannot access other user's custom (404).

Depends on: `factories.ExerciseFactory`, `factories.UserFactory`.

### test_workouts.py
Tests for `/api/workouts/` endpoints:
- **TestWorkoutCreate**: Full nested creation (session + exercise + sets), lbs-to-kg weight conversion (verifies 176 lbs = 79.83 kg), body weight conversion, empty exercises rejected, unauthenticated rejected.
- **TestWorkoutList**: User sees only their own workouts, date range filtering works.
- **TestWorkoutDetail**: Nested GET response structure, delete cascades.
- **TestWorkoutValidation**: Serializer guard rails — weight without unit, body_weight without unit, exercise with no sets, inaccessible (other user's) exercise rejected; bodyweight-only set (no weight) allowed.
- **TestWorkoutUpdate**: PUT replace strategy — replaces nested exercises/sets, lbs conversion on update, rejects inaccessible exercise, cannot update another user's workout (404, unchanged).
- **TestUserDataIsolation**: Critical security tests — user A cannot read or delete user B's workouts, user A cannot see user B's custom exercises.

Depends on: `factories.*`, `workouts.models.WorkoutSession/ExerciseSet`.

### test_onboarding.py
Tests for the onboarding endpoints (mounted in `config/urls.py`):
- **TestOnboardingState**: GET initial state (profile auto-created by signal), PATCH profile fields + step bump, flat vs. nested `profile` payload, equipment/muscle-group M2M writes, invalid choice rejected, auth required.
- **TestOnboardingComplete**: POST marks user onboarded (step=4), flat payload, requires `plan_source` (400 leaves user not onboarded), auth required.
- **TestOnboardingOptions**: GET returns equipment + muscle group reference lists, auth required.

Depends on: `factories.UserFactory/EquipmentFactory/MuscleGroupFactory`, `accounts.models.UserProfile`.

### test_models.py
Unit tests for model behaviour (no HTTP):
- **TestUserManager**: `create_user` normalizes email + hashes password, blank email raises, `create_superuser` sets staff/superuser flags.
- **TestUserProfileSignal**: `post_save` signal creates exactly one `UserProfile`, not duplicated on subsequent saves.
- **TestStrRepresentations**: `__str__` for User (display_name vs. email fallback), Exercise, WorkoutSession, WorkoutExercise, ExerciseSet (weighted vs. bodyweight), Equipment, MuscleGroup, UserProfile, UserEquipment, UserTargetMuscleGroup.
- **TestProfileRelations**: equipment unique-per-profile constraint, profile cascade-deletes with user, default ordering of Equipment/MuscleGroup.

Depends on: `factories.*`, `accounts.models.*`.

### test_commands.py
Tests for management commands:
- **TestSeedExercises**: seeds 16 global exercises (all `created_by=None`), idempotent on re-run.
- **TestCreateDemoData**: generates sessions for the demo user (deterministic via `random.seed`), aborts gracefully when no global exercises exist, reuses an existing demo user without duplicating.

Depends on: `factories.UserFactory`, `exercises.models.Exercise`, `workouts.models.WorkoutSession`.

### test_analytics.py
Tests for `/api/analytics/` endpoints. Uses a detailed 3-session fixture with hand-computed expected values:
- Session 1 (2026-06-01): Bench Press — warmup 40kg x10, working 80kg x8, working 80kg x6
- Session 2 (2026-06-08): Bench Press — warmup 40kg x10, working 85kg x5, working 82.5kg x7
- Session 3 (2026-06-15): Squat — working 100kg x5, working 100kg x5

Tests verify:
- **TestBodyWeight**: Daily series, smoothed weekly, net change, period filtering.
- **TestExerciseAnalytics**: Weight/1RM/volume/rep progressions match hand-computed values, warmup exclusion, personal records, user isolation (other user's data doesn't leak).
- **TestConsistency**: Total counts, streak calculation, weekly breakdown.
- **TestDashboard**: All sections returned, strongest lift calculation (squat 116.67 > bench 101.75), empty data doesn't crash, query count bounded to 25.

Depends on: `factories.*`, `workouts.utils.estimate_one_rep_max` (via analytics views).

### test_utils.py
Unit tests for `workouts.utils` pure functions:
- Unit conversion round-trips (kg <-> lbs).
- `display_weight` and `convert_to_kg` correctness.
- Epley 1RM formula: known values, edge cases (single rep, zero reps, zero/None weight).
- Volume calculation.
- Rest time formatting.

Depends on: `workouts.utils`.

## Running Tests
```bash
cd backend
python -m pytest
```
