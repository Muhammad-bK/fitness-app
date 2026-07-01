import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../client', () => ({ default: client }));

import * as exercisesApi from '../exercises';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('exercises api', () => {
  it('getExercises forwards search and muscle_group params', async () => {
    client.get.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });

    await exercisesApi.getExercises({ search: 'bench', muscle_group: 'chest' });

    expect(client.get).toHaveBeenCalledWith('/exercises/', {
      params: { search: 'bench', muscle_group: 'chest' },
    });
  });

  it('getExercises works without params', async () => {
    client.get.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });

    await exercisesApi.getExercises();

    expect(client.get).toHaveBeenCalledWith('/exercises/', { params: undefined });
  });

  it('createExercise posts the payload and returns the created exercise', async () => {
    client.post.mockResolvedValue({ data: { id: 'ex-1', name: 'Cable Fly', is_global: false } });

    const result = await exercisesApi.createExercise({ name: 'Cable Fly', muscle_group: 'chest', category: 'cable' });

    expect(client.post).toHaveBeenCalledWith('/exercises/', {
      name: 'Cable Fly',
      muscle_group: 'chest',
      category: 'cable',
    });
    expect(result.name).toBe('Cable Fly');
  });

  it('deleteExercise deletes by id', async () => {
    client.delete.mockResolvedValue({ data: undefined });

    await exercisesApi.deleteExercise('ex-9');

    expect(client.delete).toHaveBeenCalledWith('/exercises/ex-9/');
  });
});
