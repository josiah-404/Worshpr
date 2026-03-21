'use client';

import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventListItem } from '@/types';

export function useGetEvents(orgId?: string | null, initialData?: EventListItem[]) {
  return useQuery<EventListItem[]>({
    queryKey: [QUERY_KEYS.EVENTS, orgId ?? 'all'],
    queryFn: () => getEvents(orgId ? { orgId } : undefined),
    initialData,
    staleTime: 0,
  });
}
