import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProgramItem } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ProgramItemData, CreateProgramItemPayload, EventProgramData } from '@/types';

export const useCreateProgramItem = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProgramItemData, Error, CreateProgramItemPayload>({
    mutationFn: (payload) => createProgramItem(eventId, payload),
    onSuccess: (newItem) => {
      queryClient.setQueryData<EventProgramData | null>(
        [QUERY_KEYS.PROGRAM, eventId],
        (old) => {
          if (!old) {
            // Program was auto-created server-side; refetch to get full record
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAM, eventId] });
            return old;
          }
          return {
            ...old,
            items: [...old.items, newItem].sort(
              (a, b) => a.day - b.day || a.order - b.order,
            ),
          };
        },
      );
    },
  });
};
