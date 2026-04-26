import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function useSetupPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const { data } = await api.post('/auth/setup-password', { token, password });
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const { data } = await api.post('/auth/reset-password', { token, password });
      return data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },
  });
}
