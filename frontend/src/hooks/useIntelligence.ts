import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  estimateGoal,
  generateWorkoutPlan,
  getActiveWorkoutPlan,
  getDailyFoodLog,
  getFitnessProgress,
  getTodayWorkout,
  logFood,
  searchFoods,
  searchExerciseCatalog,
} from '../api/intelligence';
import type { FoodLogPayload, GoalEstimateRequest } from '../types/intelligence';

export function useGoalEstimate() {
  return useQuery({
    queryKey: ['goal-estimate'],
    queryFn: () => estimateGoal({}),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['food-search', query],
    queryFn: () => searchFoods(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyFoodLog(date?: string) {
  return useQuery({
    queryKey: ['food-log', date ?? 'today'],
    queryFn: () => getDailyFoodLog(date),
  });
}

export function useLogFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FoodLogPayload) => logFood(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-log'] });
      qc.invalidateQueries({ queryKey: ['fitness-progress'] });
    },
  });
}

export function useExerciseCatalog(params: { muscle?: string; difficulty?: string; type?: string }) {
  return useQuery({
    queryKey: ['exercise-catalog', params],
    queryFn: () => searchExerciseCatalog(params),
    enabled: !!(params.muscle || params.difficulty || params.type),
  });
}

export function useGenerateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateWorkoutPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-plan'] });
      qc.invalidateQueries({ queryKey: ['today-workout'] });
      qc.invalidateQueries({ queryKey: ['fitness-progress'] });
    },
  });
}

export function useWorkoutPlan() {
  return useQuery({
    queryKey: ['workout-plan'],
    queryFn: getActiveWorkoutPlan,
  });
}

export function useTodayWorkout() {
  return useQuery({
    queryKey: ['today-workout'],
    queryFn: getTodayWorkout,
    retry: false,
  });
}

export function useFitnessProgress() {
  return useQuery({
    queryKey: ['fitness-progress'],
    queryFn: getFitnessProgress,
  });
}
