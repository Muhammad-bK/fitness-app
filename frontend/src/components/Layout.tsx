import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';
import { paths } from '../routes';
const NAV_ITEMS = [
  { path: paths.home, label: 'Dashboard' },
  { path: paths.goal, label: 'Goals' },
  { path: paths.nutrition, label: 'Nutrition' },
  { path: paths.workoutPlanner, label: 'Planner' },
  { path: paths.workouts, label: 'Workouts' },
  { path: paths.log, label: 'Log' },
  { path: paths.analytics.bodyweight, label: 'Weight' },
  { path: paths.analytics.exercises, label: 'Exercises' },
  { path: paths.analytics.consistency, label: 'Consistency' },
];

const BRAND_NAME = 'Zeeshan app';

export function Layout() {
  const { user } = useAuthContext();
  const logout = useLogout();
  const location = useLocation();

  const isOnboarding = location.pathname === paths.onboarding;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = paths.login;
      },
    });
  };

  return (
    <div className="min-h-screen bg-k-bg">
      <nav className="border-b border-k-border bg-k-bg/80 backdrop-blur-sm sticky top-0 z-40">
        <div
          className={cn(
            'mx-auto px-6 flex items-center justify-between h-14',
            isOnboarding ? 'max-w-6xl' : 'max-w-6xl',
          )}
        >
          {isOnboarding ? (
            <span className="text-xs font-bold tracking-[0.18em] uppercase text-k-fg">
              {BRAND_NAME}
            </span>
          ) : (
            <div className="flex items-center gap-8">
              <Link
                to={paths.home}
                className="text-xs font-bold tracking-[0.18em] uppercase text-k-fg hover:text-k-brand transition-colors"
              >
                {BRAND_NAME}
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                      location.pathname === item.path
                        ? 'text-k-brand bg-k-brand-tint'
                        : 'text-k-muted hover:text-k-fg',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isOnboarding && (              <span className="hidden sm:block text-sm text-k-muted">
                {user?.display_name || user?.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-k-muted hover:text-k-fg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className={cn('mx-auto', isOnboarding ? 'max-w-6xl' : 'max-w-6xl px-6 py-8')}>
        <Outlet />
      </main>
    </div>
  );
}
