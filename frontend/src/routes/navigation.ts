import { paths } from './paths';

export type ExerciseProgressLocationState = {
  prevRoute?: string;
  prevLabel?: string;
};

export const exerciseProgressNav = {
  fromDashboard: {
    prevRoute: paths.home,
    prevLabel: 'Dashboard',
  },
  fromExercises: {
    prevRoute: paths.analytics.exercises,
    prevLabel: 'All Exercises',
  },
} as const;
