import { api } from '@/lib/axios';
import type { Event } from '@/types/event.types';
import type { CreateEventInput, UpdateEventInput } from '@/validations/event.schema';

export const getEvents = async (): Promise<Event[]> => {
  const { data } = await api.get<{ data: Event[] }>('/events');
  return data.data;
};

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  const { data } = await api.post<{ data: Event }>('/events', input);
  return data.data;
};

export const updateEvent = async (id: string, input: UpdateEventInput): Promise<Event> => {
  const { data } = await api.patch<{ data: Event }>(`/events/${id}`, input);
  return data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/events/${id}`);
};
