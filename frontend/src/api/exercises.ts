import type { Exercise, PaginatedResponse } from '../types';
import apiClient from './client';

export async function getExercises(params?: {
  search?: string;
  muscle_group?: string;
  page?: number;
}): Promise<PaginatedResponse<Exercise>> {
  const { data } = await apiClient.get<PaginatedResponse<Exercise>>('/exercises/', { params });
  return data;
}

export async function createExercise(payload: {
  name: string;
  muscle_group?: string;
  category?: string;
}): Promise<Exercise> {
  const { data } = await apiClient.post<Exercise>('/exercises/', payload);
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  await apiClient.delete(`/exercises/${id}/`);
}
