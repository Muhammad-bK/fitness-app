# pages

Top-level route components. Each file corresponds to one route in `App.tsx`. All authenticated pages are rendered inside the `Layout` component (which provides the nav bar and content wrapper).

## Files

### LoginPage.tsx
**Route:** `/login` (public)

Email + password login form. On success, stores tokens and navigates to `/`. Shows inline error on failure. Links to RegisterPage.

Depends on: `hooks/useAuth.ts` (useLogin).

### RegisterPage.tsx
**Route:** `/register` (public)

Registration form with email, optional display name, and password (min 8 chars). On success, stores tokens and navigates to `/`. Links to LoginPage.

Depends on: `hooks/useAuth.ts` (useRegister).

### DashboardPage.tsx
**Route:** `/` (protected)

Main landing page after login. Shows:
- **Summary cards**: Current body weight, workouts this month, strongest lift (highest all-time 1RM), latest PR.
- **Body weight trend chart**: Line chart of daily readings over 30 days (Recharts LineChart).
- **Workout frequency chart**: Bar chart of weekly workout counts over 12 weeks (Recharts BarChart).
- **Top 5 exercises**: List of most-used exercises in last 30 days, each linking to ExerciseProgressPage.

All weight values respect the user's unit_preference (kg/lbs).

Depends on: `hooks/useAnalytics.ts` (useDashboard), `context/AuthContext.tsx` (useAuthContext for unit preference), `lib/units.ts` (displayWeight, formatWeight).

### WorkoutListPage.tsx
**Route:** `/workouts` (protected)

Paginated list of the user's workout sessions. Each row shows session name, date, exercise count, and set count. Links to WorkoutDetailPage. Has a "Log Workout" button linking to LogWorkoutPage and a delete button per workout (with confirmation dialog).

Depends on: `hooks/useWorkouts.ts` (useWorkouts, useDeleteWorkout), `lib/formatters.ts` (formatDate).

### WorkoutDetailPage.tsx
**Route:** `/workouts/:id` (protected)

Full read-only view of a single workout session. Shows:
- Session header: name, date, body weight.
- For each exercise: name, category badge, and a table of sets with set number, type (color-coded badge), weight (in user's unit), reps, rest time, and notes (spotter/pause info).

Depends on: `hooks/useWorkouts.ts` (useWorkout), `context/AuthContext.tsx` (unit preference), `lib/formatters.ts` (formatDate, formatRestTime), `lib/units.ts` (formatWeight).

### LogWorkoutPage.tsx
**Route:** `/log` (protected)

Full workout logging form. The most complex page in the app.

**Form structure:**
1. Session info: name, date (defaults to today), body weight (optional), notes.
2. Exercise list: dynamically added via a search dropdown that queries the exercise library.
3. Per exercise: table of sets with type (dropdown), weight, reps, rest time, spotter checkbox, pause checkbox, and a remove button.

**Submission:** Assembles a `WorkoutWritePayload` with nested exercises and sets, sends to `POST /api/workouts/`. Weight values are sent in the user's preferred unit (the backend handles conversion to kg).

Depends on: `hooks/useExercises.ts` (useExercises for exercise search), `hooks/useWorkouts.ts` (useCreateWorkout), `context/AuthContext.tsx` (unit preference), `types/index.ts` (SetWritePayload, WorkoutExerciseWritePayload).

### BodyWeightPage.tsx
**Route:** `/analytics/bodyweight` (protected)

Body weight analytics with period selector (7d/30d/1y/All). Shows:
- Summary cards: current weight, net change (color-coded green for loss, red for gain).
- Daily readings line chart.
- Weekly average smoothed line chart.

Depends on: `hooks/useAnalytics.ts` (useBodyWeight), `context/AuthContext.tsx`, `lib/units.ts`.

### ExerciseListAnalyticsPage.tsx
**Route:** `/analytics/exercises` (protected)

Searchable list of all exercises. Each item links to ExerciseProgressPage for that exercise. Shows exercise name, muscle group badge, and category.

Depends on: `hooks/useExercises.ts` (useExercises with search param).

### ExerciseProgressPage.tsx
**Route:** `/analytics/exercise/:exerciseId` (protected)

Per-exercise analytics with period selector (30d/1y/All). Shows:
- PR cards: best weight, best session volume, best estimated 1RM (with dates).
- Four line charts: max weight per session, estimated 1RM (Epley), session volume, reps at top weight.

All values respect unit preference. Back-link to ExerciseListAnalyticsPage.

Depends on: `hooks/useAnalytics.ts` (useExerciseAnalytics), `context/AuthContext.tsx`, `lib/units.ts`.

### ConsistencyPage.tsx
**Route:** `/analytics/consistency` (protected)

Workout consistency analytics with period selector (30d/1y/All). Shows:
- Summary cards: workouts this week, this month, current streak (weeks), average per week.
- Weekly breakdown bar chart.

Depends on: `hooks/useAnalytics.ts` (useConsistency).

## Charting Library
All charts use [Recharts](https://recharts.org/) (LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer).

## Styling
All pages use Tailwind CSS utility classes. No custom CSS files per page.
