import { api } from '@/lib/axios';
import type { User, UserFormState } from '@/types';

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get<{ data: User[] }>('/users');
  return data.data;
};

export const createUser = async (form: UserFormState): Promise<User> => {
  const { data } = await api.post<{ data: User }>('/users', form);
  return data.data;
};

export const updateUser = async (
  id: string,
  form: Omit<UserFormState, 'password'>,
): Promise<User> => {
  const { data } = await api.put<{ data: User }>(`/users/${id}`, {
    name: form.name,
    email: form.email,
    role: form.role,
    orgId: form.orgId || undefined,
    title: form.title || undefined,
  });
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const resendOnboarding = async (id: string): Promise<void> => {
  await api.post(`/users/${id}/resend-onboarding`);
};

export const sendPasswordReset = async (id: string): Promise<void> => {
  await api.post(`/users/${id}/send-reset`);
};
