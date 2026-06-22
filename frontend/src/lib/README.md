# lib

Pure utility functions and storage abstractions. No React dependencies (except tokenStorage which uses browser localStorage).

## Files

### tokenStorage.ts
Abstraction over `localStorage` for JWT token management. Stores access and refresh tokens under keys `wa_access_token` and `wa_refresh_token`.

**Exported API:**
- `tokenStorage.getAccessToken()` -> string | null
- `tokenStorage.setAccessToken(token)` -> void
- `tokenStorage.getRefreshToken()` -> string | null
- `tokenStorage.setRefreshToken(token)` -> void
- `tokenStorage.clear()` -> void (removes both tokens)

Used by: `api/client.ts` (attach token to requests, handle refresh), `hooks/useAuth.ts` (store/clear tokens on login/logout), `context/AuthContext.tsx` (check if token exists).

### calculations.ts
Fitness math functions (frontend mirror of `backend/apps/workouts/utils.py`):

- `estimateOneRepMax(weightKg, reps)` -> number: Epley formula `weight * (1 + reps/30)`. Returns 0 for invalid inputs.
- `calculateSetVolume(weightKg, reps)` -> number: `weight * reps`. Returns 0 for null/invalid weight.

Used by: Currently available for client-side calculations but primary computations happen server-side in analytics views.

### formatters.ts
Display formatting functions:

- `formatRestTime(seconds)` -> string: Formats seconds to human-readable (e.g., 90 -> "1m 30s", 120 -> "2m", 45 -> "45s"). Returns empty string for null/0.
- `formatDate(dateStr)` -> string: Formats ISO date string to short display format (e.g., "2026-06-22" -> "Mon, Jun 22").

Used by: `pages/WorkoutDetailPage.tsx` (formatRestTime, formatDate), `pages/WorkoutListPage.tsx` (formatDate).

### units.ts
Unit conversion functions (frontend mirror of `backend/apps/workouts/utils.py`):

- `kgToLbs(kg)` -> number: Converts kg to lbs (rounded to 1 decimal).
- `lbsToKg(lbs)` -> number: Converts lbs to kg (rounded to 1 decimal).
- `displayWeight(valueKg, unitPreference)` -> number: Converts stored kg value to the user's preferred unit.
- `formatWeight(valueKg, unitPreference)` -> string: Returns formatted string like "80 kg" or "176.4 lbs".

Uses the constant `LBS_PER_KG = 2.2046226218`.

Used by: `pages/DashboardPage.tsx`, `pages/BodyWeightPage.tsx`, `pages/ExerciseProgressPage.tsx`, `pages/WorkoutDetailPage.tsx`.

## Tests (__tests__/)

### __tests__/calculations.test.ts
Tests for `estimateOneRepMax` (Epley values, edge cases) and `calculateSetVolume`.

### __tests__/formatters.test.ts
Tests for `formatRestTime` (minutes+seconds, minutes only, seconds only, null, zero) and `formatDate`.

### __tests__/units.test.ts
Tests for `kgToLbs`, `lbsToKg`, `displayWeight`, and `formatWeight`.

Run with: `npx vitest` from the `frontend/` directory.
