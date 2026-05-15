'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import type { ChatRoom, TypingPayload } from '@/types/chat.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useTypingChannel(room: ChatRoom | null, currentUserId: string) {
  const { data: session } = useSession();
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentAt = useRef<number>(0);

  useEffect(() => {
    if (!room) return;

    const channelName =
      room.type === 'EVENT' && room.eventId
        ? `typing:event:${room.eventId}`
        : `typing:org:${room.orgId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'typing' },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const { userId, userName } = payload as unknown as TypingPayload;
          if (userId === currentUserId) return;

          clearTimeout(timers.current.get(userId));
          setTypingUsers((prev) => new Map(prev).set(userId, userName));

          const timer = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(userId);
              return next;
            });
            timers.current.delete(userId);
          }, 3000);

          timers.current.set(userId, timer);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      setTypingUsers(new Map());
    };
  }, [room?.id, room?.type, room?.eventId, room?.orgId, currentUserId]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !session?.user) return;
    const now = Date.now();
    if (now - lastSentAt.current < 1000) return;
    lastSentAt.current = now;

    void channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: session.user.id, userName: session.user.name },
    });
  }, [session?.user]);

  return {
    typingNames: Array.from(typingUsers.values()),
    broadcastTyping,
  };
}
