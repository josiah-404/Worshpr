import { api } from '@/lib/axios';
import type { Church } from '@/types';
import type { GetChurchesListParams, PaginatedChurchesResponse } from '@/types/church.types';

export interface GetChurchesParams {
  orgId?: string;
}

export interface CreateChurchPayload {
  orgId: string;
  name: string;
  location?: string;
}

export interface UpdateChurchPayload {
  name?: string;
  location?: string;
  isActive?: boolean;
}

export const getChurches = async (params?: GetChurchesParams): Promise<Church[]> => {
  const { data } = await api.get<{ data: Church[] }>('/churches', { params });
  return data.data;
};

export const getChurchesList = async (
  params: GetChurchesListParams,
): Promise<PaginatedChurchesResponse> => {
  const { data } = await api.get<PaginatedChurchesResponse>('/churches', { params });
  return data;
};

export const createChurch = async (payload: CreateChurchPayload): Promise<Church> => {
  const { data } = await api.post('/churches', payload);
  return data.data;
};

export const updateChurch = async (id: string, payload: UpdateChurchPayload): Promise<Church> => {
  const { data } = await api.patch(`/churches/${id}`, payload);
  return data.data;
};

export const deleteChurch = async (id: string): Promise<void> => {
  await api.delete(`/churches/${id}`);
};

export const getEventChurches = async (eventId: string): Promise<{ participating: Church[]; available: Church[] }> => {
  const { data } = await api.get(`/events/${eventId}/churches`);
  return data.data;
};

export const setEventChurches = async (eventId: string, churchIds: string[]): Promise<void> => {
  await api.put(`/events/${eventId}/churches`, { churchIds });
};
