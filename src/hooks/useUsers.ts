'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createUser, updateUser, deleteUser, resendOnboarding, sendPasswordReset } from '@/services/user.service';
import { EMPTY_USER_FORM, QUERY_KEYS } from '@/lib/constants';
import type { UserFormState } from '@/types';

export type { User, UserFormState } from '@/types';
export { EMPTY_USER_FORM };

export function useUsers() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
  }

  async function handleCreateUser(form: UserFormState) {
    setLoading(true);
    setError('');
    try {
      const created = await createUser(form);
      invalidateUsers();
      toast.success('User created', { description: `${created.name} has been added.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(id: string, form: UserFormState) {
    setLoading(true);
    setError('');
    try {
      const updated = await updateUser(id, form);
      invalidateUsers();
      toast.success('User updated', { description: `${updated.name} has been updated.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      await deleteUser(id);
      invalidateUsers();
      toast.success('User removed');
    } catch {
      toast.error('Delete failed', { description: 'Failed to remove user.' });
    }
  }

  async function handleResendOnboarding(id: string, name: string) {
    try {
      await resendOnboarding(id);
      toast.success('Onboarding email sent', { description: `Setup link resent to ${name}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send email';
      toast.error('Email failed', { description: msg });
    }
  }

  async function handleSendPasswordReset(id: string, name: string) {
    try {
      await sendPasswordReset(id);
      toast.success('Reset email sent', { description: `Password reset link sent to ${name}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send email';
      toast.error('Email failed', { description: msg });
    }
  }

  return {
    loading,
    error,
    setError,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    resendOnboarding: handleResendOnboarding,
    sendPasswordReset: handleSendPasswordReset,
  };
}
