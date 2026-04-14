import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertProgram } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventProgramData, UpsertProgramPayload } from '@/types';

export const useUpsertProgram = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation<EventProgramData, Error, UpsertProgramPayload>({
    mutationFn: (payload) => upsertProgram(eventId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.PROGRAM, eventId], data);
    },
  });
};
