import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setEventRegistrantTypes } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventRegistrantType, EventRegistrantTypeInput } from '@/types';

export function useSetEventRegistrantTypes(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<EventRegistrantType[], Error, EventRegistrantTypeInput[]>({
    mutationFn: (items) => setEventRegistrantTypes(eventId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_REGISTRANT_TYPES, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
