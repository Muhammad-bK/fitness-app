export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  workouts: '/workouts',
  workout: (id: string | number) => `/workouts/${id}`,
  log: '/log',
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
  workouts: '/workouts',
  workout: '/workouts/:id',
  log: '/log',
  analytics: {
    bodyweight: '/analytics/bodyweight',
    exercises: '/analytics/exercises',
    exercise: '/analytics/exercise/:exerciseId',
    consistency: '/analytics/consistency',
  },
} as const;
