'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAiSearchQuota, consumeAiSearchQuota } from '@/services/ai-quota.service';
import type { AiSearchQuotaRecord } from '@/types';

const QUERY_KEY = ['ai-search-quota'];

/** Cooldown between requests to respect the Gemini free-tier RPM limit (~10 RPM). */
const COOLDOWN_MS = 7_000;

export function useAiSearchQuota() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AiSearchQuotaRecord>({
    queryKey: QUERY_KEY,
    queryFn: getAiSearchQuota,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const { mutateAsync: consume, isPending: isConsuming } = useMutation<AiSearchQuotaRecord, Error, number | undefined>({
    mutationFn: (amount) => consumeAiSearchQuota(amount ?? 1),
    onSuccess: (updated) => {
      queryClient.setQueryData<AiSearchQuotaRecord>(QUERY_KEY, updated);
    },
  });

  const quotaExhausted = (data?.remaining ?? 1) <= 0;

  return {
    quota: data,
    isLoading,
    quotaExhausted,
    isConsuming,
    cooldownMs: COOLDOWN_MS,
    consume,
  };
}
