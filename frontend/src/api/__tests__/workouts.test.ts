import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../client', () => ({ default: client }));

import * as workoutsApi from '../workouts';
import type { WorkoutWritePayload } from '../../types';

beforeEach(() => {
  vi.clearAllMocks();
});

const writePayload: WorkoutWritePayload = {
  session_name: 'Push Day',
  workout_date: '2026-06-20',
  exercises: [
    {
      exercise_id: 'ex-1',
      order_in_session: 1,
      sets: [{ set_number: 1, set_type: 'working', weight: 80, weight_unit: 'kg', reps: 8 }],
    },
  ],
};

describe('workouts api', () => {
  it('getWorkouts forwards date and page params', async () => {
    client.get.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });

    const result = await workoutsApi.getWorkouts({ start: '2026-06-01', end: '2026-06-30', page: 2 });

    expect(client.get).toHaveBeenCalledWith('/workouts/', {
      params: { start: '2026-06-01', end: '2026-06-30', page: 2 },
    });
    expect(result.results).toEqual([]);
  });

  it('getWorkout fetches a single session by id', async () => {
    client.get.mockResolvedValue({ data: { id: 'w-1', session_name: 'Push Day' } });

    const result = await workoutsApi.getWorkout('w-1');

    expect(client.get).toHaveBeenCalledWith('/workouts/w-1/');
    expect(result.id).toBe('w-1');
  });

  it('createWorkout posts the nested payload', async () => {
    client.post.mockResolvedValue({ data: { id: 'w-2' } });

    const result = await workoutsApi.createWorkout(writePayload);

    expect(client.post).toHaveBeenCalledWith('/workouts/', writePayload);
    expect(result.id).toBe('w-2');
  });

  it('updateWorkout puts to the session url', async () => {
    client.put.mockResolvedValue({ data: { id: 'w-3' } });

    const result = await workoutsApi.updateWorkout('w-3', writePayload);

    expect(client.put).toHaveBeenCalledWith('/workouts/w-3/', writePayload);
    expect(result.id).toBe('w-3');
  });

  it('deleteWorkout deletes by id', async () => {
    client.delete.mockResolvedValue({ data: undefined });

    await workoutsApi.deleteWorkout('w-4');

    expect(client.delete).toHaveBeenCalledWith('/workouts/w-4/');
  });
});
