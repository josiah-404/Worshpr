import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProgramItem } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ProgramItemData, UpdateProgramItemPayload, EventProgramData } from '@/types';

interface UpdateProgramItemArgs {
  itemId: string;
  payload: UpdateProgramItemPayload;
}

export const useUpdateProgramItem = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProgramItemData, Error, UpdateProgramItemArgs>({
    mutationFn: ({ itemId, payload }) => updateProgramItem(eventId, itemId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<EventProgramData | null>(
        [QUERY_KEYS.PROGRAM, eventId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items
              .map((item) => (item.id === updated.id ? updated : item))
              .sort((a, b) => a.day - b.day || a.order - b.order),
          };
        },
      );
    },
  });
};
