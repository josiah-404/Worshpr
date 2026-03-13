'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/services/organization.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { Organization } from '@/types';

export function useGetOrganizations() {
  return useQuery<Organization[]>({
    queryKey: [QUERY_KEYS.ORGANIZATIONS],
    queryFn: getOrganizations,
  });
}
