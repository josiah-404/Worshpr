'use client';

import { useQuery } from '@tanstack/react-query';
import { getEventRoom } from '@/services/chat.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ChatRoom } from '@/types/chat.types';

export function useEventRoom(eventId: string | null) {
  return useQuery<ChatRoom>({
    queryKey: [QUERY_KEYS.CHAT_EVENT_ROOM, eventId],
    queryFn: () => getEventRoom(eventId!),
    enabled: !!eventId,
    staleTime: Infinity,
  });
}
