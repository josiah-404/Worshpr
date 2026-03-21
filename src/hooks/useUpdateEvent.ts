'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEvent } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventListItem } from '@/types';
import type { UpdateEventInput } from '@/validations/event.schema';

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation<EventListItem, Error, UpdateEventInput>({
    mutationFn: (data) => updateEvent(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      queryClient.setQueryData([QUERY_KEYS.EVENT, id], updated);
    },
  });
}
