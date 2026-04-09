'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrgFund } from '@/services/finance.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useOrgContext } from '@/providers/OrgContext';
import type { OrgFundDetail } from '@/types/finance.types';

export function useGetOrgFund(initialData?: OrgFundDetail | null) {
  const { activeOrgId } = useOrgContext();

  return useQuery<OrgFundDetail | null>({
    queryKey: [QUERY_KEYS.ORG_FUND, activeOrgId],
    queryFn: () => getOrgFund(activeOrgId ?? undefined),
    initialData: initialData ?? undefined,
    staleTime: 30_000,
  });
}
