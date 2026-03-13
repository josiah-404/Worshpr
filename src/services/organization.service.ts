import { api } from '@/lib/axios';
import type { Organization, OrganizationFormState } from '@/types';

export const getOrganizations = async (): Promise<Organization[]> => {
  const { data } = await api.get<{ data: Organization[] }>('/organizations');
  return data.data;
};

export const createOrganization = async (
  form: OrganizationFormState,
): Promise<Organization> => {
  const { data } = await api.post<{ data: Organization }>('/organizations', form);
  return data.data;
};

export const updateOrganization = async (
  id: string,
  form: Partial<OrganizationFormState> & { isActive?: boolean },
): Promise<Organization> => {
  const { data } = await api.put<{ data: Organization }>(`/organizations/${id}`, form);
  return data.data;
};

export const deleteOrganization = async (id: string): Promise<void> => {
  await api.delete(`/organizations/${id}`);
};
