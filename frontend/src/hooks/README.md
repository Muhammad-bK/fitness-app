# hooks

React Query hooks that wrap the api layer. These are the primary data-fetching interface used by page components. All hooks handle caching, refetching, and cache invalidation via TanStack React Query.

## Files

### useAuth.ts
Authentication hooks:

| Hook | Type | Query Key | Description |
|------|------|-----------|-------------|
| `useMe(enabled?)` | Query | `['me']` | Fetches current user profile. 5-min staleTime. Disabled when no token. |
| `useLogin()` | Mutation | — | Calls `login()`, stores tokens in `tokenStorage`, invalidates `['me']`. |
| `useRegister()` | Mutation | — | Calls `register()`, stores tokens, invalidates `['me']`. |
| `useLogout()` | Mutation | — | Calls `logout()` with refresh token, clears `tokenStorage`, clears all query cache. |
| `useUpdateProfile()` | Mutation | — | Calls `updateMe()`, invalidates `['me']`. |

Depends on: `api/auth.ts`, `lib/tokenStorage.ts`.
Used by: `context/AuthContext.tsx` (useMe), `pages/LoginPage.tsx` (useLogin), `pages/RegisterPage.tsx` (useRegister), `components/Layout.tsx` (useLogout).

### useExercises.ts
Exercise hooks:

| Hook | Type | Query Key | Description |
|------|------|-----------|-------------|
| `useExercises(params?)` | Query | `['exercises', params]` | Paginated list with optional search/muscle_group filters. |
| `useCreateExercise()` | Mutation | — | Creates exercise, invalidates `['exercises']`. |

Depends on: `api/exercises.ts`.
Used by: `pages/LogWorkoutPage.tsx` (useExercises for exercise picker), `pages/ExerciseListAnalyticsPage.tsx`.

### useWorkouts.ts
Workout hooks:

| Hook | Type | Query Key | Description |
|------|------|-----------|-------------|
| `useWorkouts(params?)` | Query | `['workouts', params]` | Paginated list with optional start/end date filters. |
| `useWorkout(id)` | Query | `['workout', id]` | Single workout with full nested data. Enabled only when id is truthy. |
| `useCreateWorkout()` | Mutation | — | Creates workout, invalidates `['workouts']`. |
| `useDeleteWorkout()` | Mutation | — | Deletes workout, invalidates `['workouts']`. |

Depends on: `api/workouts.ts`, `types/index.ts`.
Used by: `pages/WorkoutListPage.tsx`, `pages/WorkoutDetailPage.tsx`, `pages/LogWorkoutPage.tsx`.

### useAnalytics.ts
Analytics hooks:

| Hook | Type | Query Key | Description |
|------|------|-----------|-------------|
| `useBodyWeight(period)` | Query | `['analytics', 'bodyweight', period]` | Body weight trend data. Default period: month. |
| `useExerciseAnalytics(exerciseId, period)` | Query | `['analytics', 'exercise', exerciseId, period]` | Per-exercise progression. Enabled only when exerciseId is truthy. Default period: year. |
| `useConsistency(period)` | Query | `['analytics', 'consistency', period]` | Workout consistency stats. Default period: month. |
| `useDashboard()` | Query | `['analytics', 'dashboard']` | Dashboard aggregate data. 60-second staleTime. |

Depends on: `api/analytics.ts`.
Used by: `pages/DashboardPage.tsx`, `pages/BodyWeightPage.tsx`, `pages/ExerciseProgressPage.tsx`, `pages/ConsistencyPage.tsx`.
