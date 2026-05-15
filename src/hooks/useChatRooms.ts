'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrgContext } from '@/providers/OrgContext';
import { getOrgRooms } from '@/services/chat.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ChatRoom } from '@/types/chat.types';

export function useChatRooms() {
  const { activeOrgId } = useOrgContext();

  return useQuery<ChatRoom[]>({
    queryKey: [QUERY_KEYS.CHAT_ROOMS, activeOrgId],
    queryFn: () => getOrgRooms(activeOrgId ?? undefined),
    enabled: !!activeOrgId,
    staleTime: 60_000,
  });
}
