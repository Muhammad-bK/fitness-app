import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as workoutsApi from '../api/workouts';
import type { WorkoutWritePayload } from '../types';

export function useWorkouts(params?: { start?: string; end?: string; page?: number }) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => workoutsApi.getWorkouts(params),
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutsApi.getWorkout(id),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkoutWritePayload) => workoutsApi.createWorkout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkoutWritePayload }) =>
      workoutsApi.updateWorkout(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workoutsApi.deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
