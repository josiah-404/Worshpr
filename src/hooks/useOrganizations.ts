'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '@/services/organization.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { OrganizationRow, OrganizationFormState } from '@/types';

export const EMPTY_ORG_FORM: OrganizationFormState = {
  name: '',
  logoUrl: '',
};

export function useOrganizations(initialOrgs: OrganizationRow[]) {
  const queryClient = useQueryClient();
  const [organizations, setOrganizations] = useState<OrganizationRow[]>(initialOrgs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(form: OrganizationFormState) {
    setLoading(true);
    setError('');
    try {
      const created = await createOrganization(form);
      setOrganizations((prev) => [{ ...created, _count: { users: 0 } }, ...prev]);
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ORGANIZATIONS], type: 'active' });
      toast.success('Organization created', { description: `${created.name} has been added.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(
    id: string,
    form: Partial<OrganizationFormState> & { isActive?: boolean },
  ) {
    setLoading(true);
    setError('');
    try {
      const updated = await updateOrganization(id, form);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...updated, _count: o._count } : o)),
      );
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ORGANIZATIONS], type: 'active' });
      toast.success('Organization updated', { description: `${updated.name} has been updated.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOrganization(id);
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ORGANIZATIONS], type: 'active' });
      toast.success('Organization deleted');
    } catch {
      toast.error('Delete failed', { description: 'Failed to delete organization.' });
    }
  }

  return {
    organizations,
    loading,
    error,
    setError,
    createOrganization: handleCreate,
    updateOrganization: handleUpdate,
    deleteOrganization: handleDelete,
  };
}
