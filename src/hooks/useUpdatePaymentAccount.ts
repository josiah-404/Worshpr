'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePaymentAccount } from '@/services/payment-account.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaymentAccount } from '@/types';
import type { UpdatePaymentAccountInput } from '@/validations/payment-account.schema';

interface UpdatePaymentAccountArgs {
  id: string;
  data: UpdatePaymentAccountInput;
}

export function useUpdatePaymentAccount() {
  const queryClient = useQueryClient();

  return useMutation<PaymentAccount, Error, UpdatePaymentAccountArgs>({
    mutationFn: ({ id, data }) => updatePaymentAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS] });
    },
  });
}
