import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChurch, type UpdateChurchPayload } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { Church } from '@/types';

export function useUpdateChurch() {
  const queryClient = useQueryClient();
  return useMutation<Church, Error, { id: string; data: UpdateChurchPayload }>({
    mutationFn: ({ id, data }) => updateChurch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHURCHES] });
    },
  });
}
