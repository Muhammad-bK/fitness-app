import apiClient from './client';
import type {
  CatalogExercise,
  DailyFoodLog,
  FitnessProgress,
  FoodItem,
  FoodLogEntry,
  FoodLogPayload,
  FoodSearchResponse,
  GeneratedWorkoutPlan,
  GoalEstimate,
  GoalEstimateRequest,
  MuscleAnatomy,
  TodayWorkout,
} from '../types/intelligence';

export async function estimateGoal(payload: GoalEstimateRequest = {}): Promise<GoalEstimate> {
  const resp = await apiClient.post('/goal/estimate/', payload);
  const body = resp.data;
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const { data } = await apiClient.get<FoodSearchResponse>('/food/search/', { params: { q: query } });
  return data.results;
}

export async function getFoodDetail(fdcId: number): Promise<FoodItem> {
  const { data } = await apiClient.get<FoodItem>(`/food/${fdcId}/`);
  return data;
}

export async function logFood(payload: FoodLogPayload): Promise<FoodLogEntry> {
  const { data } = await apiClient.post<FoodLogEntry>('/food/log/', payload);
  return data;
}

export async function getDailyFoodLog(date?: string): Promise<DailyFoodLog> {
  const { data } = await apiClient.get<DailyFoodLog>('/food/log/', { params: date ? { date } : {} });
  return data;
}

export async function searchExerciseCatalog(params: {
  muscle?: string;
  difficulty?: string;
  type?: string;
}): Promise<CatalogExercise[]> {
  const { data } = await apiClient.get<{ results: CatalogExercise[] }>('/intelligence/exercise-catalog/', { params });
  return data.results;
}

export async function generateWorkoutPlan(payload: Record<string, unknown> = {}): Promise<GeneratedWorkoutPlan> {
  const { data } = await apiClient.post<GeneratedWorkoutPlan>('/workout/generate/', payload);
  return data;
}

export async function getTodayWorkout(): Promise<TodayWorkout> {
  const { data } = await apiClient.get<TodayWorkout>('/workout/today/');
  return data;
}

export async function getActiveWorkoutPlan(): Promise<GeneratedWorkoutPlan | null> {
  const { data } = await apiClient.get<{ plan: GeneratedWorkoutPlan | null }>('/workout/plan/');
  return data.plan;
}

export async function getFitnessProgress(): Promise<FitnessProgress> {
  const { data } = await apiClient.get<FitnessProgress>('/intelligence/progress/');
  return data;
}

export async function getMuscleAnatomy(): Promise<MuscleAnatomy> {
  const { data } = await apiClient.get<{ anatomy: MuscleAnatomy }>('/intelligence/muscle-anatomy/');
  return data.anatomy;
}
