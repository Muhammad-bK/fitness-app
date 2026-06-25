import type { AuthTokens, OnboardingOptions, OnboardingState, User } from '../types';
import apiClient from './client';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login/', { email, password });
  return data;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register/', {
    email,
    password,
    display_name: displayName,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout/', { refresh: refreshToken });
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/');
  return data;
}

export async function updateMe(updates: Partial<Pick<User, 'display_name' | 'unit_preference'>>): Promise<User> {
  const { data } = await apiClient.patch<User>('/auth/me/', updates);
  return data;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const { data } = await apiClient.get<OnboardingState>('/onboarding/');
  return data;
}

export async function patchOnboardingState(payload: Partial<OnboardingState>): Promise<OnboardingState> {
  const { data } = await apiClient.patch<OnboardingState>('/onboarding/', payload);
  return data;
}

export async function completeOnboarding(profile: Partial<OnboardingState['profile']>): Promise<OnboardingState> {
  const { data } = await apiClient.post<OnboardingState>('/onboarding/complete/', profile);
  return data;
}

export async function getOnboardingOptions(): Promise<OnboardingOptions> {
  const { data } = await apiClient.get<OnboardingOptions>('/onboarding/options/');
  return data;
}
