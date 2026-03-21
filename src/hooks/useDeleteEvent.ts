'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEvent } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EVENTS], type: 'active' });
    },
  });
}
