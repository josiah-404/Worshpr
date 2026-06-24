'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizationsList } from '@/services/organization.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { GetOrganizationsListParams, PaginatedOrganizationsResponse } from '@/types';

export function useGetOrganizationsList(params: GetOrganizationsListParams) {
  return useQuery<PaginatedOrganizationsResponse>({
    queryKey: [QUERY_KEYS.ORGANIZATIONS, 'list', params],
    queryFn: () => getOrganizationsList(params),
    staleTime: 30_000,
  });
}
