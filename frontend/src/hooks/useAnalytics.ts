import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '../api/analytics';

type Period = 'week' | 'month' | 'year' | 'all';

export function useBodyWeight(period: Period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'bodyweight', period],
    queryFn: () => analyticsApi.getBodyWeight({ period }),
  });
}

export function useExerciseAnalytics(exerciseId: string | undefined, period: Period = 'year') {
  return useQuery({
    queryKey: ['analytics', 'exercise', exerciseId, period],
    queryFn: () => analyticsApi.getExerciseAnalytics(exerciseId!, { period }),
    enabled: !!exerciseId,
  });
}

export function useConsistency(period: Period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'consistency', period],
    queryFn: () => analyticsApi.getConsistency({ period }),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.getDashboard,
    staleTime: 60_000,
  });
}
