'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createUser, updateUser, deleteUser } from '@/services/user.service';
import { EMPTY_USER_FORM } from '@/lib/constants';
import type { User, UserFormState } from '@/types';

export type { User, UserFormState };
export { EMPTY_USER_FORM };

export function useUsers(initialUsers: User[]) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateUser(form: UserFormState) {
    setLoading(true);
    setError('');
    try {
      const created = await createUser(form);
      setUsers((prev) => [created, ...prev]);
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
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User removed');
    } catch {
      toast.error('Delete failed', { description: 'Failed to remove user.' });
    }
  }

  return {
    users,
    loading,
    error,
    setError,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
  };
}
