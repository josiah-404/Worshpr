'use client';

import { useQuery } from '@tanstack/react-query';
import { getCollaborations } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { CollaborationInvite } from '@/types';

export function useGetCollaborations(initialData?: CollaborationInvite[]) {
  return useQuery<CollaborationInvite[]>({
    queryKey: [QUERY_KEYS.COLLABORATIONS],
    queryFn: getCollaborations,
    initialData,
    staleTime: 0,
  });
}
