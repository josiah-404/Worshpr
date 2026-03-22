import { signIn } from 'next-auth/react';

import type { LoginInput } from '@/validations/auth.schema';

export const login = async (credentials: LoginInput): Promise<void> => {
  const result = await signIn('credentials', {
    ...credentials,
    redirect: false,
  });

  if (result?.error) {
    throw new Error('Invalid email or password.');
  }
};
