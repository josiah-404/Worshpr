import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setEventChurches } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useSetEventChurches(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: (churchIds) => setEventChurches(eventId, churchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_CHURCHES, eventId] });
    },
  });
}
