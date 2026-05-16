'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, getChatChannelName } from '@/lib/supabase';
import type { ChatRoom, ChatMessage } from '@/types/chat.types';

export function useUnreadCounts(
  rooms: ChatRoom[],
  activeRoomId: string | null,
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
    if (activeRoomId) {
      setCounts((prev) => ({ ...prev, [activeRoomId]: 0 }));
    }
  }, [activeRoomId]);

  const orgId = rooms[0]?.orgId;

  useEffect(() => {
    if (!orgId) return;

    const channelName = getChatChannelName('org', orgId);
    const channel = supabase
      .channel(`unread:${channelName}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const msg = payload as unknown as ChatMessage;
          if (msg.roomId === activeRoomIdRef.current) return;
          setCounts((prev) => ({
            ...prev,
            [msg.roomId]: (prev[msg.roomId] ?? 0) + 1,
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId]);

  return counts;
}
