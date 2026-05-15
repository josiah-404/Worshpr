'use client';

import { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import type { ChatRoom } from '@/types/chat.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useTypingBroadcast(room: ChatRoom | null) {
  const { data: session } = useSession();
  const lastSentAt = useRef<number>(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!room) return;

    const channelName =
      room.type === 'EVENT' && room.eventId
        ? `typing:event:${room.eventId}`
        : `typing:org:${room.orgId}`;

    const channel = supabase.channel(channelName);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room?.id, room?.type, room?.eventId, room?.orgId]);

  const broadcastTyping = () => {
    if (!channelRef.current || !session?.user) return;
    const now = Date.now();
    if (now - lastSentAt.current < 1000) return; // throttle: max 1 event/sec
    lastSentAt.current = now;

    void channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: session.user.id, userName: session.user.name },
    });
  };

  return broadcastTyping;
}
