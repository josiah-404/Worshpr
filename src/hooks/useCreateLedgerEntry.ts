'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLedgerEntry } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useCreateLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLedgerEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEDGER] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.LEDGER] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    },
  });
}
