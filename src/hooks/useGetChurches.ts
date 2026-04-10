import { useQuery } from '@tanstack/react-query';
import { getChurches } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { Church } from '@/types';

export function useGetChurches(orgId?: string | null) {
  return useQuery<Church[]>({
    queryKey: [QUERY_KEYS.CHURCHES, orgId ?? 'all'],
    queryFn: () => getChurches(orgId ? { orgId } : undefined),
    staleTime: 30_000,
  });
}
