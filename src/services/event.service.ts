import { api } from '@/lib/axios';
import type { EventListItem, CollaborationInvite } from '@/types';
import type { CreateEventInput, UpdateEventInput, InviteOrgInput } from '@/validations/event.schema';

export const getEvents = async (params?: { orgId?: string }): Promise<EventListItem[]> => {
  const { data } = await api.get<{ data: EventListItem[] }>('/events', { params });
  return data.data;
};

export const createEvent = async (input: CreateEventInput): Promise<EventListItem> => {
  const { data } = await api.post<{ data: EventListItem }>('/events', input);
  return data.data;
};

export const updateEvent = async (
  id: string,
  input: UpdateEventInput,
): Promise<EventListItem> => {
  const { data } = await api.patch<{ data: EventListItem }>(`/events/${id}`, input);
  return data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/events/${id}`);
};

export const inviteOrg = async (eventId: string, input: InviteOrgInput): Promise<void> => {
  await api.post(`/events/${eventId}/invite`, input);
};

export const respondToInvite = async (
  eventId: string,
  orgId: string,
  status: 'ACCEPTED' | 'DECLINED',
): Promise<void> => {
  await api.patch(`/events/${eventId}/invite/${orgId}`, { status });
};

export const getCollaborations = async (): Promise<CollaborationInvite[]> => {
  const { data } = await api.get<{ data: CollaborationInvite[] }>('/collaborations');
  return data.data;
};
