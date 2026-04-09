'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrgFund } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useUpdateOrgFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrgFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    },
  });
}
