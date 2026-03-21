'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventListItem } from '@/types';
import type { CreateEventInput } from '@/validations/event.schema';

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<EventListItem, Error, CreateEventInput>({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
