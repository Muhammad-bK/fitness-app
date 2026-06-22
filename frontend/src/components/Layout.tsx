import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/workouts', label: 'Workouts' },
  { path: '/log', label: 'Log' },
  { path: '/analytics/bodyweight', label: 'Weight' },
  { path: '/analytics/exercises', label: 'Exercises' },
  { path: '/analytics/consistency', label: 'Consistency' },
];

export function Layout() {
  const { user } = useAuthContext();
  const logout = useLogout();
  const location = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/login';
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg text-gray-900">
              Workout Tracker
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.display_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
