import { useQuery } from '@tanstack/react-query';
import { getEventRegistrantTypes } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventRegistrantType } from '@/types';

export function useGetEventRegistrantTypes(eventId: string | null | undefined) {
  return useQuery<EventRegistrantType[]>({
    queryKey: [QUERY_KEYS.EVENT_REGISTRANT_TYPES, eventId],
    queryFn: () => getEventRegistrantTypes(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
