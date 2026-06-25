import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { tokenStorage } from '../lib/tokenStorage';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: async (data) => {
      tokenStorage.setAccessToken(data.access);
      tokenStorage.setRefreshToken(data.refresh);
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: authApi.getMe });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => authApi.register(email, password, displayName),
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.tokens.access);
      tokenStorage.setRefreshToken(data.tokens.refresh);
    
      queryClient.setQueryData(['me'], data.user);
    
      void queryClient.invalidateQueries({
        queryKey: ['onboarding-state'],
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const refresh = tokenStorage.getRefreshToken();
      if (!refresh) return Promise.resolve();
      return authApi.logout(refresh);
    },
    onSettled: () => {
      tokenStorage.clear();
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
