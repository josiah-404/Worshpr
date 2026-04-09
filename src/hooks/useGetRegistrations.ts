'use client';

import { useQuery } from '@tanstack/react-query';
import { getRegistrations, type GetRegistrationsParams } from '@/services/registration.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useOrgContext } from '@/providers/OrgContext';
import type { RegistrationListItem } from '@/types';

export function useGetRegistrations(
  params: Omit<GetRegistrationsParams, 'orgId'>,
  initialData?: RegistrationListItem[],
) {
  const { activeOrgId } = useOrgContext();
  const mergedParams: GetRegistrationsParams = {
    ...params,
    ...(activeOrgId ? { orgId: activeOrgId } : {}),
  };

  return useQuery<RegistrationListItem[]>({
    queryKey: [QUERY_KEYS.REGISTRATIONS, mergedParams],
    queryFn: () => getRegistrations(mergedParams),
    initialData,
    staleTime: 30_000,
  });
}
