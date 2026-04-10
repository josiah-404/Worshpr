import { useQuery } from '@tanstack/react-query';
import { getEventChurches } from '@/services/church.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { Church } from '@/types';

export function useGetEventChurches(eventId: string | null | undefined) {
  return useQuery<{ participating: Church[]; available: Church[] }>({
    queryKey: [QUERY_KEYS.EVENT_CHURCHES, eventId],
    queryFn: () => getEventChurches(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
