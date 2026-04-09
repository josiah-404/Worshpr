'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLedgerEntry } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateLedgerEntryPayload } from '@/types/finance.types';

export function useUpdateLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLedgerEntryPayload }) =>
      updateLedgerEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEDGER] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    },
  });
}
