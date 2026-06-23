import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setEventFeeItems } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventFeeItem, EventFeeItemInput } from '@/types';

export function useSetEventFeeItems(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<EventFeeItem[], Error, EventFeeItemInput[]>({
    mutationFn: (items) => setEventFeeItems(eventId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_FEE_ITEMS, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
