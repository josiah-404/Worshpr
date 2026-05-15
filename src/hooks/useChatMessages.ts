'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRoomMessages } from '@/services/chat.service';
import { supabase, getChatChannelName } from '@/lib/supabase';
import { QUERY_KEYS } from '@/lib/constants';
import type { ChatRoom, ChatMessage } from '@/types/chat.types';

export function useChatMessages(room: ChatRoom | null) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const { data: history = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [QUERY_KEYS.CHAT_MESSAGES, room?.id],
    queryFn: () => getRoomMessages(room!.id),
    enabled: !!room,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!room) return;

    setLiveMessages([]);

    const channelName =
      room.type === 'EVENT' && room.eventId
        ? getChatChannelName('event', room.eventId)
        : getChatChannelName('org', room.orgId);

    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const msg = payload as unknown as ChatMessage;
          setLiveMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [msg, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id, room?.type, room?.eventId, room?.orgId]);

  const messages: ChatMessage[] = [...liveMessages, ...history];

  return { messages, isLoading };
}
