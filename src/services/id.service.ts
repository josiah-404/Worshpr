import { api } from '@/lib/axios';
import type { IdTemplateRecord, IdEventListItem } from '@/types/id.types';
import type { IdTemplateInput } from '@/validations/id.schema';

export const getIdEvents = async (params?: { orgId?: string }): Promise<IdEventListItem[]> => {
  const { data } = await api.get<{ data: IdEventListItem[] }>('/ids', { params });
  return data.data;
};

export const getIdTemplate = async (eventId: string): Promise<IdTemplateRecord | null> => {
  const { data } = await api.get(`/events/${eventId}/id-template`);
  return data.data ?? null;
};

export const saveIdTemplate = async (
  eventId: string,
  payload: IdTemplateInput,
): Promise<IdTemplateRecord> => {
  const { data } = await api.put(`/events/${eventId}/id-template`, payload);
  return data.data;
};
