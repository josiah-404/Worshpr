import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteChurch } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useDeleteChurch() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteChurch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHURCHES] });
    },
  });
}
