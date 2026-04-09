'use client';

import { useQuery } from '@tanstack/react-query';
import { getFinanceSummary } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useOrgContext } from '@/providers/OrgContext';
import type { FinanceSummary } from '@/types/finance.types';

export function useGetFinanceSummary(initialData?: FinanceSummary | null) {
  const { activeOrgId } = useOrgContext();

  return useQuery<FinanceSummary | null>({
    queryKey: [QUERY_KEYS.FINANCE_SUMMARY, activeOrgId],
    queryFn: () => getFinanceSummary(activeOrgId ? { orgId: activeOrgId } : undefined),
    initialData: initialData ?? undefined,
    staleTime: 30_000,
  });
}
