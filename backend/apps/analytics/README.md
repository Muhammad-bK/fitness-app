# analytics

Read-only analytics endpoints. No models of its own — queries data from the workouts and exercises apps to compute statistics, progressions, and personal records.

## Files

### views.py
Four APIView classes, all requiring `IsAuthenticated`. All views share a `_parse_period(request)` helper that reads `?period=` (week/month/year/all) or explicit `?start=`/`?end=` date params and returns a `(start_date, end_date)` tuple.

- **BodyWeightView** (`GET /api/analytics/bodyweight/`)
  - Returns: daily body weight readings, smoothed weekly averages (using `TruncWeek` + `Avg`), current weight, and net change over the period.
  - Queries: `WorkoutSession` where `body_weight_kg` is not null, scoped to user.
  - Response shape: `{ period, daily[], smoothed_weekly[], current_weight_kg, net_change_kg }`

- **ExerciseAnalyticsView** (`GET /api/analytics/exercise/{exercise_id}/`)
  - Returns: per-session weight progression, rep progression, volume progression, estimated 1RM progression (Epley formula), and personal records (best weight, best volume, best 1RM).
  - Warmup sets are excluded from all calculations.
  - Queries: `ExerciseSet` joined through `WorkoutExercise` and `WorkoutSession`, filtered by exercise_id and user.
  - Uses: `estimate_one_rep_max()` from `workouts.utils`.
  - Response shape: `{ exercise, period, weight_progression[], rep_progression[], volume_progression[], one_rm_progression[], personal_records }`

- **ConsistencyView** (`GET /api/analytics/consistency/`)
  - Returns: workouts this week, workouts this month, total in period, current weekly streak (consecutive ISO weeks with at least 1 workout going backwards), average workouts per week, and weekly breakdown counts.
  - Queries: `WorkoutSession` scoped to user.
  - Response shape: `{ period, workouts_this_week, workouts_this_month, total_workouts, current_streak_weeks, avg_workouts_per_week, weekly_breakdown[] }`

- **DashboardView** (`GET /api/analytics/dashboard/`)
  - Aggregates multiple statistics in a single response for the frontend dashboard:
    - Current body weight + 30-day weight change
    - Workouts this month
    - Body weight trend (daily, last 30 days)
    - Workout frequency (weekly counts, last 12 weeks)
    - Strongest lift across all exercises (highest estimated 1RM, all time)
    - Latest PR (most recent new best 1RM)
    - Top 5 exercises by session count in the last 30 days
  - Queries: Multiple queries across `WorkoutSession`, `ExerciseSet`, `WorkoutExercise`.
  - Uses: `estimate_one_rep_max()` from `workouts.utils`.
  - Response shape: `{ current_weight_kg, weight_change_30d_kg, workouts_this_month, strongest_lift, latest_pr, weight_trend[], workout_frequency[], top_exercises[] }`

### urls.py
Four URL patterns mounted at `/api/analytics/` in `backend/config/urls.py`:

| Path | View | Description |
|------|------|-------------|
| `bodyweight/` | BodyWeightView | Body weight tracking over time |
| `exercise/{exercise_id}/` | ExerciseAnalyticsView | Per-exercise progression & PRs |
| `consistency/` | ConsistencyView | Workout frequency & streaks |
| `dashboard/` | DashboardView | Combined overview for dashboard page |

### admin.py
Empty — no models to register.

### apps.py
Standard Django app config. App name: `apps.analytics`.

## Dependencies
- **Models used**: `exercises.Exercise`, `workouts.WorkoutSession`, `workouts.WorkoutExercise`, `workouts.ExerciseSet`
- **Utilities used**: `workouts.utils.estimate_one_rep_max`
- **Consumed by**: Frontend `api/analytics.ts` -> `hooks/useAnalytics.ts` -> analytics pages (DashboardPage, BodyWeightPage, ExerciseProgressPage, ConsistencyPage)
