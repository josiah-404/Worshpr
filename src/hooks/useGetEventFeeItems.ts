import { useQuery } from '@tanstack/react-query';
import { getEventFeeItems } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventFeeItem } from '@/types';

export function useGetEventFeeItems(eventId: string | null | undefined) {
  return useQuery<EventFeeItem[]>({
    queryKey: [QUERY_KEYS.EVENT_FEE_ITEMS, eventId],
    queryFn: () => getEventFeeItems(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
