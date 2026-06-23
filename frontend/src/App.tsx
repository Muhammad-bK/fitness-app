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
import { EditWorkoutPage } from './pages/EditWorkoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { BodyWeightPage } from './pages/BodyWeightPage';
import { ExerciseProgressPage } from './pages/ExerciseProgressPage';
import { ExerciseListAnalyticsPage } from './pages/ExerciseListAnalyticsPage';
import { ConsistencyPage } from './pages/ConsistencyPage';
import { routePatterns } from './routes';

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
            <Route path={routePatterns.login} element={<LoginPage />} />
            <Route path={routePatterns.register} element={<RegisterPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path={routePatterns.home} element={<DashboardPage />} />
              <Route path={routePatterns.workouts} element={<WorkoutListPage />} />
              <Route path={routePatterns.workout} element={<WorkoutDetailPage />} />
              <Route path={routePatterns.editWorkout} element={<EditWorkoutPage />} />
              <Route path={routePatterns.log} element={<LogWorkoutPage />} />
              <Route path={routePatterns.analytics.bodyweight} element={<BodyWeightPage />} />
              <Route path={routePatterns.analytics.exercises} element={<ExerciseListAnalyticsPage />} />
              <Route path={routePatterns.analytics.exercise} element={<ExerciseProgressPage />} />
              <Route path={routePatterns.analytics.consistency} element={<ConsistencyPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
