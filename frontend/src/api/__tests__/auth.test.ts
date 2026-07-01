import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../client', () => ({ default: client }));

import * as authApi from '../auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth api', () => {
  it('login posts credentials and returns tokens', async () => {
    client.post.mockResolvedValue({ data: { access: 'a', refresh: 'r' } });

    const result = await authApi.login('me@test.com', 'secret');

    expect(client.post).toHaveBeenCalledWith('/auth/login/', {
      email: 'me@test.com',
      password: 'secret',
    });
    expect(result).toEqual({ access: 'a', refresh: 'r' });
  });

  it('register posts email, password and display name', async () => {
    client.post.mockResolvedValue({ data: { user: { id: '1' }, tokens: { access: 'a', refresh: 'r' } } });

    const result = await authApi.register('new@test.com', 'secret', 'New User');

    expect(client.post).toHaveBeenCalledWith('/auth/register/', {
      email: 'new@test.com',
      password: 'secret',
      display_name: 'New User',
    });
    expect(result.tokens.access).toBe('a');
  });

  it('logout posts the refresh token', async () => {
    client.post.mockResolvedValue({ data: undefined });

    await authApi.logout('refresh-token');

    expect(client.post).toHaveBeenCalledWith('/auth/logout/', { refresh: 'refresh-token' });
  });

  it('getMe fetches the current user', async () => {
    client.get.mockResolvedValue({ data: { id: '1', email: 'me@test.com' } });

    const result = await authApi.getMe();

    expect(client.get).toHaveBeenCalledWith('/auth/me/');
    expect(result.email).toBe('me@test.com');
  });

  it('updateMe patches profile updates', async () => {
    client.patch.mockResolvedValue({ data: { id: '1', unit_preference: 'lbs' } });

    const result = await authApi.updateMe({ unit_preference: 'lbs' });

    expect(client.patch).toHaveBeenCalledWith('/auth/me/', { unit_preference: 'lbs' });
    expect(result.unit_preference).toBe('lbs');
  });

  it('getOnboardingState fetches onboarding state', async () => {
    client.get.mockResolvedValue({ data: { is_onboarded: false, onboarding_step: 0, profile: {} } });

    const result = await authApi.getOnboardingState();

    expect(client.get).toHaveBeenCalledWith('/onboarding/');
    expect(result.is_onboarded).toBe(false);
  });

  it('patchOnboardingState patches onboarding progress', async () => {
    client.patch.mockResolvedValue({ data: { is_onboarded: false, onboarding_step: 2, profile: {} } });

    const result = await authApi.patchOnboardingState({ onboarding_step: 2 });

    expect(client.patch).toHaveBeenCalledWith('/onboarding/', { onboarding_step: 2 });
    expect(result.onboarding_step).toBe(2);
  });

  it('completeOnboarding posts the final profile', async () => {
    client.post.mockResolvedValue({ data: { is_onboarded: true, onboarding_step: 4, profile: {} } });

    const result = await authApi.completeOnboarding({ plan_source: 'app_generated' });

    expect(client.post).toHaveBeenCalledWith('/onboarding/complete/', { plan_source: 'app_generated' });
    expect(result.is_onboarded).toBe(true);
  });

  it('getOnboardingOptions fetches equipment and muscle groups', async () => {
    client.get.mockResolvedValue({ data: { equipment: [], muscle_groups: [] } });

    const result = await authApi.getOnboardingOptions();

    expect(client.get).toHaveBeenCalledWith('/onboarding/options/');
    expect(result).toEqual({ equipment: [], muscle_groups: [] });
  });
});
