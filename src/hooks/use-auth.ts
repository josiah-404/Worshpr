import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { api } from '@/lib/axios';

export const useAuth = () => {
  const router = useRouter();

  const setupPassword = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const { data: res } = await api.post('/auth/setup-password', data);
      return res;
    },
    onSuccess: () => {
      toast.success('Password set successfully!');
      setTimeout(() => router.push('/login'), 2000);
    },
    onError: (err: Error) => {
      toast.error('Failed to set password', { description: err.message });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const { data: res } = await api.post('/auth/reset-password', data);
      return res;
    },
    onSuccess: () => {
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/login'), 2000);
    },
    onError: (err: Error) => {
      toast.error('Failed to reset password', { description: err.message });
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (email: string) => {
      const { data: res } = await api.post('/auth/forgot-password', { email });
      return res;
    },
    onSuccess: () => {
      toast.success('Reset link sent! Check your inbox.');
    },
    onError: (err: Error) => {
      toast.error('Failed to send reset link', { description: err.message });
    },
  });

  return { setupPassword, resetPassword, forgotPassword };
};
