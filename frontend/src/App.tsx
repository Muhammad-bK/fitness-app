import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkoutListPage } from './pages/WorkoutListPage';
import { WorkoutDetailPage } from './pages/WorkoutDetailPage';
import { LogWorkoutPage } from './pages/LogWorkoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { BodyWeightPage } from './pages/BodyWeightPage';
import { ExerciseProgressPage } from './pages/ExerciseProgressPage';
import { ExerciseListAnalyticsPage } from './pages/ExerciseListAnalyticsPage';
import { ConsistencyPage } from './pages/ConsistencyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/workouts" element={<WorkoutListPage />} />
              <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
              <Route path="/log" element={<LogWorkoutPage />} />
              <Route path="/analytics/bodyweight" element={<BodyWeightPage />} />
              <Route path="/analytics/exercises" element={<ExerciseListAnalyticsPage />} />
              <Route path="/analytics/exercise/:exerciseId" element={<ExerciseProgressPage />} />
              <Route path="/analytics/consistency" element={<ConsistencyPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
