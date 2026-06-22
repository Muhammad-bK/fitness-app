import type {
  PaginatedResponse,
  WorkoutSession,
  WorkoutSessionListItem,
  WorkoutWritePayload,
} from '../types';
import apiClient from './client';

export async function getWorkouts(params?: {
  start?: string;
  end?: string;
  page?: number;
}): Promise<PaginatedResponse<WorkoutSessionListItem>> {
  const { data } = await apiClient.get<PaginatedResponse<WorkoutSessionListItem>>('/workouts/', { params });
  return data;
}

export async function getWorkout(id: string): Promise<WorkoutSession> {
  const { data } = await apiClient.get<WorkoutSession>(`/workouts/${id}/`);
  return data;
}

export async function createWorkout(payload: WorkoutWritePayload): Promise<WorkoutSession> {
  const { data } = await apiClient.post<WorkoutSession>('/workouts/', payload);
  return data;
}

export async function updateWorkout(id: string, payload: WorkoutWritePayload): Promise<WorkoutSession> {
  const { data } = await apiClient.put<WorkoutSession>(`/workouts/${id}/`, payload);
  return data;
}

export async function deleteWorkout(id: string): Promise<void> {
  await apiClient.delete(`/workouts/${id}/`);
}
