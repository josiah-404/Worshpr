'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { login } from '@/services/auth.service';
import type { LoginInput } from '@/validations/auth.schema';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginInput) => login(credentials),
    onSuccess: () => {
      toast.success('Welcome back!', { description: 'You have signed in successfully.' });
      router.push('/');
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error('Sign in failed', { description: err.message });
    },
  });
}
