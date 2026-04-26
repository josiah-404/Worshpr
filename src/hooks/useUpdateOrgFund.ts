'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrgFund } from '@/services/finance.service';
import { useOrgContext } from '@/providers/OrgContext';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateOrgFundPayload } from '@/types/finance.types';

export function useUpdateOrgFund() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useOrgContext();

  return useMutation({
    mutationFn: (payload: Omit<UpdateOrgFundPayload, 'orgId'>) =>
      updateOrgFund({ ...payload, orgId: activeOrgId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    },
  });
}
