import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChurch, type CreateChurchPayload } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { Church } from '@/types';

export function useCreateChurch() {
  const queryClient = useQueryClient();
  return useMutation<Church, Error, CreateChurchPayload>({
    mutationFn: createChurch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHURCHES] });
    },
  });
}
