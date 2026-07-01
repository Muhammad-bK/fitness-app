export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  workouts: '/workouts',
  workout: (id: string | number) => `/workouts/${id}`,
  editWorkout: (id: string | number) => `/workouts/${id}/edit`,
  log: '/log',
  goal: '/goal',
  nutrition: '/nutrition',
  workoutPlanner: '/workout-planner',
  analytics: {
    bodyweight: '/analytics/bodyweight',
    exercises: '/analytics/exercises',
    exercise: (exerciseId: string | number) => `/analytics/exercise/${exerciseId}`,
    consistency: '/analytics/consistency',
  },
} as const;

export const routePatterns = {
  home: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  workouts: '/workouts',
  workout: '/workouts/:id',
  editWorkout: '/workouts/:id/edit',
  log: '/log',
  goal: '/goal',
  nutrition: '/nutrition',
  workoutPlanner: '/workout-planner',
  analytics: {
    bodyweight: '/analytics/bodyweight',
    exercises: '/analytics/exercises',
    exercise: '/analytics/exercise/:exerciseId',
    consistency: '/analytics/consistency',
  },
} as const;
