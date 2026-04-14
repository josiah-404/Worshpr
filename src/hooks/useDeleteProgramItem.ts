import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProgramItem } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventProgramData } from '@/types';

export const useDeleteProgramItem = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (itemId) => deleteProgramItem(eventId, itemId),
    onSuccess: (_data, itemId) => {
      queryClient.setQueryData<EventProgramData | null>(
        [QUERY_KEYS.PROGRAM, eventId],
        (old) => {
          if (!old) return old;
          return { ...old, items: old.items.filter((item) => item.id !== itemId) };
        },
      );
    },
  });
};
