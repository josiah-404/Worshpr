import { api } from '@/lib/axios';
import type { AiSearchQuotaRecord } from '@/types';

export const getAiSearchQuota = async (): Promise<AiSearchQuotaRecord> => {
  const { data } = await api.get<{ data: AiSearchQuotaRecord }>('/ai-search-quota');
  return data.data;
};

export const consumeAiSearchQuota = async (amount = 1): Promise<AiSearchQuotaRecord> => {
  const { data } = await api.post<{ data: AiSearchQuotaRecord }>('/ai-search-quota', { amount });
  return data.data;
};
