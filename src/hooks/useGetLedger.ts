'use client';

import { useQuery } from '@tanstack/react-query';
import { getLedger } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useOrgContext } from '@/providers/OrgContext';
import type { LedgerEntry, LedgerQueryParams } from '@/types/finance.types';

export function useGetLedger(params?: Omit<LedgerQueryParams, 'orgId'>, initialData?: LedgerEntry[]) {
  const { activeOrgId } = useOrgContext();
  const mergedParams: LedgerQueryParams = {
    ...params,
    ...(activeOrgId ? { orgId: activeOrgId } : {}),
  };

  return useQuery<LedgerEntry[]>({
    queryKey: [QUERY_KEYS.LEDGER, mergedParams],
    queryFn: () => getLedger(mergedParams),
    initialData,
    staleTime: 30_000,
  });
}
