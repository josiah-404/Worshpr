import { api } from '@/lib/axios';
import type {
  PublicEventData,
  RegistrationGroupPayload,
  RegistrationGroupResult,
  RegistrationListItem,
} from '@/types';

export const getEventBySlug = async (slug: string): Promise<PublicEventData> => {
  const { data } = await api.get(`/events/by-slug/${slug}`);
  return data.data;
};

export const submitRegistration = async (
  payload: RegistrationGroupPayload,
): Promise<RegistrationGroupResult> => {
  const { data } = await api.post('/registrations', payload);
  return data.data;
};

export interface GetRegistrationsParams {
  orgId?: string;
  eventId?: string;
  status?: string;
}

export const getRegistrations = async (
  params: GetRegistrationsParams,
): Promise<RegistrationListItem[]> => {
  const { data } = await api.get('/registrations', { params });
  return data.data;
};

export interface UpdateRegistrationStatusPayload {
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
}

export const updateRegistrationStatus = async (
  id: string,
  payload: UpdateRegistrationStatusPayload,
): Promise<Pick<RegistrationListItem, 'id' | 'status' | 'notes' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt'>> => {
  const { data } = await api.patch(`/registrations/${id}`, payload);
  return data.data;
};
