# types

Central TypeScript type definitions. Single file (`index.ts`) that defines all interfaces used across the frontend.

## Files

### index.ts
All types exported from one file, organized into groups:

**Auth types:**
- `User`: id, email, display_name, unit_preference (kg/lbs), created_at.
- `AuthTokens`: access + refresh JWT strings.

**Exercise types:**
- `Exercise`: id, name, muscle_group, category (enum), is_global, created_by, created_at.

**Workout read types (from GET responses):**
- `ExerciseSet`: Full set data including display_weight computed field.
- `WorkoutExercise`: Exercise + nested sets array.
- `WorkoutSession`: Full session with nested workout_exercises, display_body_weight.
- `WorkoutSessionListItem`: Lightweight list version with exercise_count and set_count (no nested data).

**Workout write types (for POST/PUT payloads):**
- `SetWritePayload`: weight + weight_unit (not weight_kg — backend handles conversion).
- `WorkoutExerciseWritePayload`: exercise_id + sets array.
- `WorkoutWritePayload`: Full session creation payload with nested exercises.

**Pagination:**
- `PaginatedResponse<T>`: Standard DRF pagination shape with count, next, previous, results.

**Error type:**
- `ApiError`: Matches the backend's custom error envelope (`{ error: { code, message, details } }`).

**Analytics types:**
- `BodyWeightPoint`, `SmoothedWeekPoint`, `BodyWeightAnalytics`: Body weight tracking response.
- `WeightProgressionPoint`, `RepProgressionPoint`, `VolumeProgressionPoint`, `OneRmProgressionPoint`: Per-exercise progression data.
- `PersonalRecord`, `ExerciseAnalytics`: Exercise analytics response with PRs.
- `WeeklyCount`, `ConsistencyAnalytics`: Workout consistency response.
- `TopExercise`, `DashboardAnalytics`: Dashboard aggregate response.

## Usage
Every API function, hook, and page component imports types from this file. Keeping all types centralized ensures consistency between the API layer and the UI.

Used by: `api/*.ts`, `hooks/*.ts`, `pages/LogWorkoutPage.tsx`, `context/AuthContext.tsx`.
