import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../client', () => ({ default: client }));

import * as analyticsApi from '../analytics';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analytics api', () => {
  it('getBodyWeight forwards the period params', async () => {
    client.get.mockResolvedValue({ data: { daily: [], smoothed_weekly: [] } });

    await analyticsApi.getBodyWeight({ period: 'month' });

    expect(client.get).toHaveBeenCalledWith('/analytics/bodyweight/', { params: { period: 'month' } });
  });

  it('getExerciseAnalytics builds the per-exercise url and forwards params', async () => {
    client.get.mockResolvedValue({ data: { weight_progression: [] } });

    await analyticsApi.getExerciseAnalytics('ex-1', { start: '2026-06-01', end: '2026-06-30' });

    expect(client.get).toHaveBeenCalledWith('/analytics/exercise/ex-1/', {
      params: { start: '2026-06-01', end: '2026-06-30' },
    });
  });

  it('getConsistency forwards params', async () => {
    client.get.mockResolvedValue({ data: { total_workouts: 0 } });

    await analyticsApi.getConsistency({ period: 'year' });

    expect(client.get).toHaveBeenCalledWith('/analytics/consistency/', { params: { period: 'year' } });
  });

  it('getDashboard hits the dashboard endpoint and returns data', async () => {
    client.get.mockResolvedValue({ data: { workouts_this_month: 5 } });

    const result = await analyticsApi.getDashboard();

    expect(client.get).toHaveBeenCalledWith('/analytics/dashboard/');
    expect(result.workouts_this_month).toBe(5);
  });
});
