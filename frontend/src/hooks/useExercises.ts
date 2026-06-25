import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as exercisesApi from '../api/exercises';

export function useExercises(params?: { search?: string; muscle_group?: string }) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: () => exercisesApi.getExercises(params),
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exercisesApi.createExercise,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
