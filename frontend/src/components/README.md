# components

Shared layout and routing components used across the app.

## Files

### Layout.tsx
Main app shell rendered for all authenticated routes. Contains:
- **Top navigation bar**: Logo/title ("Workout Tracker"), navigation links (Dashboard, Workouts, Log, Weight, Exercises, Consistency), user display name/email, and a logout button.
- **Content area**: Renders child routes via React Router's `<Outlet />`.
- Active nav link is highlighted in blue.
- Logout calls `useLogout()` and redirects to `/login` on success.

Depends on: `context/AuthContext.tsx` (useAuthContext for user info), `hooks/useAuth.ts` (useLogout), `react-router-dom`.
Used by: `App.tsx` as the layout wrapper for all protected routes.

### ProtectedRoute.tsx
Route guard component that:
1. Shows a loading spinner while auth state is being determined.
2. Redirects to `/login` if the user is not authenticated.
3. Renders children if authenticated.

Depends on: `context/AuthContext.tsx` (useAuthContext for isAuthenticated, isLoading).
Used by: `App.tsx` to wrap the `<Layout />` route.
