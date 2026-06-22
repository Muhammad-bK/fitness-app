# api

HTTP client layer. Each file wraps axios calls to a specific backend API group and returns typed responses. All functions are consumed by the corresponding React Query hooks in `hooks/`.

## Files

### client.ts
Central axios instance with:
- **Base URL**: `VITE_API_URL` env var or `http://localhost:8000/api`.
- **Request interceptor**: Attaches `Bearer {accessToken}` from `lib/tokenStorage` to every request.
- **Response interceptor (401 handling)**: On 401 response:
  1. Attempts to refresh the token via `POST /api/auth/refresh/`.
  2. Queues concurrent requests while refreshing (prevents duplicate refresh calls).
  3. If refresh succeeds: retries original request with new token.
  4. If refresh fails: clears tokens from storage (forces re-login).

Depends on: `lib/tokenStorage.ts`.
Used by: All other api files.

### auth.ts
Auth API functions:
- `login(email, password)` -> `{ access, refresh }` — `POST /api/auth/login/`
- `register(email, password, displayName?)` -> `{ user, tokens }` — `POST /api/auth/register/`
- `logout(refreshToken)` -> void — `POST /api/auth/logout/`
- `getMe()` -> User — `GET /api/auth/me/`
- `updateMe(updates)` -> User — `PATCH /api/auth/me/`

Depends on: `client.ts`, `types/index.ts` (User, AuthTokens).
Used by: `hooks/useAuth.ts`.

### exercises.ts
Exercise API functions:
- `getExercises(params?)` -> `PaginatedResponse<Exercise>` — `GET /api/exercises/` with optional `search`, `muscle_group`, `page` params.
- `createExercise(payload)` -> Exercise — `POST /api/exercises/`
- `deleteExercise(id)` -> void — `DELETE /api/exercises/{id}/`

Depends on: `client.ts`, `types/index.ts`.
Used by: `hooks/useExercises.ts`.

### workouts.ts
Workout API functions:
- `getWorkouts(params?)` -> `PaginatedResponse<WorkoutSessionListItem>` — `GET /api/workouts/` with optional `start`, `end`, `page` params.
- `getWorkout(id)` -> WorkoutSession — `GET /api/workouts/{id}/` (full nested response).
- `createWorkout(payload)` -> WorkoutSession — `POST /api/workouts/` (nested write).
- `updateWorkout(id, payload)` -> WorkoutSession — `PUT /api/workouts/{id}/`
- `deleteWorkout(id)` -> void — `DELETE /api/workouts/{id}/`

Depends on: `client.ts`, `types/index.ts` (WorkoutSession, WorkoutSessionListItem, WorkoutWritePayload).
Used by: `hooks/useWorkouts.ts`.

### analytics.ts
Analytics API functions:
- `getBodyWeight(params?)` -> BodyWeightAnalytics — `GET /api/analytics/bodyweight/`
- `getExerciseAnalytics(exerciseId, params?)` -> ExerciseAnalytics — `GET /api/analytics/exercise/{id}/`
- `getConsistency(params?)` -> ConsistencyAnalytics — `GET /api/analytics/consistency/`
- `getDashboard()` -> DashboardAnalytics — `GET /api/analytics/dashboard/`

All accept optional `PeriodParams` (`period`, `start`, `end`).

Depends on: `client.ts`, `types/index.ts`.
Used by: `hooks/useAnalytics.ts`.
