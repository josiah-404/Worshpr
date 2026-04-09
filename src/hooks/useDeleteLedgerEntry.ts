'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLedgerEntry } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useDeleteLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLedgerEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEDGER] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
      // Force immediate refetch regardless of staleTime
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.LEDGER] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    },
  });
}
