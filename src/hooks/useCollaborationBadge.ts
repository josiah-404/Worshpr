'use client';

import { useQuery } from '@tanstack/react-query';
import { getCollaborations } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useCollaborationBadge() {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.COLLABORATIONS],
    queryFn: getCollaborations,
    refetchInterval: 30_000, // poll every 30s
    staleTime: 0,
  });

  return data ? data.filter((i) => i.inviteStatus === 'PENDING').length : 0;
}
