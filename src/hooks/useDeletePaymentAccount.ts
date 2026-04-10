'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePaymentAccount } from '@/services/payment-account.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deletePaymentAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
