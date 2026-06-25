import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import type { OnboardingOptions, OnboardingState, UserProfile } from '../types';

export function useOnboardingState(enabled = true) {
  return useQuery<OnboardingState>({
    queryKey: ['onboarding-state'],
    queryFn: authApi.getOnboardingState,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOnboardingOptions() {
  return useQuery<OnboardingOptions>({
    queryKey: ['onboarding-options'],
    queryFn: authApi.getOnboardingOptions,
    retry: false,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useSaveOnboardingProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<OnboardingState>) => authApi.patchOnboardingState(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding-state'], data);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => authApi.completeOnboarding(profile),
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding-state'], data);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
