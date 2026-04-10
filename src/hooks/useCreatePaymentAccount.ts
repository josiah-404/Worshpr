'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaymentAccount } from '@/services/payment-account.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaymentAccount } from '@/types';
import type { CreatePaymentAccountInput } from '@/validations/payment-account.schema';

export function useCreatePaymentAccount() {
  const queryClient = useQueryClient();

  return useMutation<PaymentAccount, Error, CreatePaymentAccountInput>({
    mutationFn: createPaymentAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS] });
    },
  });
}
