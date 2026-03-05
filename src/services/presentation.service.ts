import { api } from '@/lib/axios';
import type { Presentation } from '@/types';

export const getPresentations = async (): Promise<Presentation[]> => {
  const { data } = await api.get<{ data: Presentation[] }>('/presentations');
  return data.data;
};

export const getPresentation = async (id: string): Promise<Presentation> => {
  const { data } = await api.get<{ data: Presentation }>(`/presentations/${id}`);
  return data.data;
};

export const deletePresentation = async (id: string): Promise<void> => {
  await api.delete(`/presentations/${id}`);
};
