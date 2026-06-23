import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { tokenStorage } from '../lib/tokenStorage';
import { paths } from '../routes';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const hasToken = !!tokenStorage.getAccessToken();

  if (isLoading || (hasToken && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  return <>{children}</>;
}
