# context

React context providers for global state.

## Files

### AuthContext.tsx
Provides authentication state to the entire app via React Context.

**AuthContextValue shape:**
- `user`: The current User object, null if not logged in, undefined during initial load.
- `isLoading`: True while the initial `/api/auth/me/` call is in flight (only when a token exists in storage).
- `isAuthenticated`: True if `user` is truthy.

**How it works:**
1. Checks `tokenStorage` for an existing access token.
2. If a token exists, calls `useMe()` (React Query hook) to fetch the user profile from `/api/auth/me/`.
3. Exposes the auth state to all descendants.

**Exported:**
- `AuthProvider` component — wraps the app in `App.tsx`.
- `useAuthContext()` hook — used by components to read auth state.

Depends on: `hooks/useAuth.ts` (useMe), `lib/tokenStorage.ts`, `types/index.ts` (User).
Used by: `App.tsx` (provider), `components/Layout.tsx`, `components/ProtectedRoute.tsx`, `pages/DashboardPage.tsx`, `pages/WorkoutDetailPage.tsx`, `pages/LogWorkoutPage.tsx`, `pages/BodyWeightPage.tsx`, `pages/ExerciseProgressPage.tsx`.
