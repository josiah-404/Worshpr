'use client';

import { useQuery } from '@tanstack/react-query';
import { getChurchesList } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useOrgContext } from '@/providers/OrgContext';
import type { GetChurchesListParams, PaginatedChurchesResponse } from '@/types/church.types';

interface UseGetChurchesListOptions {
  isSuperAdmin: boolean;
  ssrOrgId?: string;
}

export function useGetChurchesList(
  params: Omit<GetChurchesListParams, 'orgId'>,
  options: UseGetChurchesListOptions,
) {
  const { activeOrgId } = useOrgContext();
  const orgId = activeOrgId ?? options.ssrOrgId;
  const mergedParams: GetChurchesListParams = {
    ...params,
    ...(orgId ? { orgId } : {}),
  };

  return useQuery<PaginatedChurchesResponse>({
    queryKey: [QUERY_KEYS.CHURCHES, 'list', mergedParams],
    queryFn: () => getChurchesList(mergedParams),
    staleTime: 30_000,
    enabled: options.isSuperAdmin ? true : !!orgId,
  });
}
