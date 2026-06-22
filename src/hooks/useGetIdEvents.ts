'use client';

import { useQuery } from '@tanstack/react-query';
import { getIdEvents } from '@/services/id.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { IdEventListItem } from '@/types/id.types';

export function useGetIdEvents(orgId?: string | null, initialData?: IdEventListItem[]) {
  return useQuery<IdEventListItem[]>({
    queryKey: [QUERY_KEYS.ID_EVENTS, orgId ?? 'all'],
    queryFn: () => getIdEvents(orgId ? { orgId } : undefined),
    initialData,
    staleTime: 0,
  });
}
