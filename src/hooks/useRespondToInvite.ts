'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToInvite } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';

interface RespondPayload {
  eventId: string;
  orgId: string;
  status: 'ACCEPTED' | 'DECLINED';
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RespondPayload>({
    mutationFn: ({ eventId, orgId, status }) => respondToInvite(eventId, orgId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLABORATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
