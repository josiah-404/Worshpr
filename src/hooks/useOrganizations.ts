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
import type { OrganizationFormState } from '@/types';

export const EMPTY_ORG_FORM: OrganizationFormState = {
  name: '',
  logoUrl: '',
};

export function useOrganizations() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function invalidateOrganizations() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGANIZATIONS] });
  }

  async function handleCreate(form: OrganizationFormState) {
    setLoading(true);
    setError('');
    try {
      const created = await createOrganization(form);
      invalidateOrganizations();
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
      invalidateOrganizations();
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
      invalidateOrganizations();
      toast.success('Organization deleted');
    } catch {
      toast.error('Delete failed', { description: 'Failed to delete organization.' });
    }
  }

  return {
    loading,
    error,
    setError,
    createOrganization: handleCreate,
    updateOrganization: handleUpdate,
    deleteOrganization: handleDelete,
  };
}
