import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderProgramItems } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventProgramData } from '@/types';

interface ReorderArgs {
  items: { id: string; order: number }[];
  optimistic: EventProgramData['items'];
}

export const useReorderProgramItems = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderArgs>({
    mutationFn: ({ items }) => reorderProgramItems(eventId, items),
    onMutate: ({ optimistic }) => {
      queryClient.setQueryData<EventProgramData | null>(
        [QUERY_KEYS.PROGRAM, eventId],
        (old) => (old ? { ...old, items: optimistic } : old),
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAM, eventId] });
    },
  });
};
