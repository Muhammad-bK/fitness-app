import apiClient from './client';
import type {
  BodyWeightAnalytics,
  ConsistencyAnalytics,
  DashboardAnalytics,
  ExerciseAnalytics,
} from '../types';

interface PeriodParams {
  period?: 'week' | 'month' | 'year' | 'all';
  start?: string;
  end?: string;
}

export async function getBodyWeight(params?: PeriodParams): Promise<BodyWeightAnalytics> {
  const { data } = await apiClient.get('/analytics/bodyweight/', { params });
  return data;
}

export async function getExerciseAnalytics(
  exerciseId: string,
  params?: PeriodParams,
): Promise<ExerciseAnalytics> {
  const { data } = await apiClient.get(`/analytics/exercise/${exerciseId}/`, { params });
  return data;
}

export async function getConsistency(params?: PeriodParams): Promise<ConsistencyAnalytics> {
  const { data } = await apiClient.get('/analytics/consistency/', { params });
  return data;
}

export async function getDashboard(): Promise<DashboardAnalytics> {
  const { data } = await apiClient.get('/analytics/dashboard/');
  return data;
}
