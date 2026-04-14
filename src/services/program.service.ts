import { api } from '@/lib/axios';
import type {
  EventProgramData,
  ProgramItemData,
  CreateProgramItemPayload,
  UpdateProgramItemPayload,
  UpsertProgramPayload,
} from '@/types';

export const getProgram = async (eventId: string): Promise<EventProgramData | null> => {
  const { data } = await api.get(`/events/${eventId}/program`);
  return data.data;
};

export const upsertProgram = async (
  eventId: string,
  payload: UpsertProgramPayload,
): Promise<EventProgramData> => {
  const { data } = await api.put(`/events/${eventId}/program`, payload);
  return data.data;
};

export const createProgramItem = async (
  eventId: string,
  payload: CreateProgramItemPayload,
): Promise<ProgramItemData> => {
  const { data } = await api.post(`/events/${eventId}/program/items`, payload);
  return data.data;
};

export const updateProgramItem = async (
  eventId: string,
  itemId: string,
  payload: UpdateProgramItemPayload,
): Promise<ProgramItemData> => {
  const { data } = await api.patch(`/events/${eventId}/program/items/${itemId}`, payload);
  return data.data;
};

export const deleteProgramItem = async (
  eventId: string,
  itemId: string,
): Promise<void> => {
  await api.delete(`/events/${eventId}/program/items/${itemId}`);
};

export const reorderProgramItems = async (
  eventId: string,
  items: { id: string; order: number }[],
): Promise<void> => {
  await api.put(`/events/${eventId}/program/items/reorder`, { items });
};
