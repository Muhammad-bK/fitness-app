import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { tokenStorage } from '../lib/tokenStorage';
import { paths } from '../routes';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const hasToken = !!tokenStorage.getAccessToken();
  const location = useLocation();

  if (isLoading || (hasToken && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-k-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-k-brand border-t-transparent animate-spin" />
          <p className="text-sm text-k-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  if (!user?.is_onboarded && location.pathname !== paths.onboarding) {
    return <Navigate to={paths.onboarding} replace />;
  }

  if (user?.is_onboarded && location.pathname === paths.onboarding) {
    return <Navigate to={paths.home} replace />;
  }

  return <>{children}</>;
}
