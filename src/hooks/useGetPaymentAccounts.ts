'use client';

import { useQuery } from '@tanstack/react-query';
import { getPaymentAccounts } from '@/services/payment-account.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaymentAccount } from '@/types';

export function useGetPaymentAccounts(orgId?: string | null) {
  return useQuery<PaymentAccount[]>({
    queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS, orgId ?? 'all'],
    queryFn: () => getPaymentAccounts(orgId ? { orgId } : undefined),
    staleTime: 0,
  });
}
