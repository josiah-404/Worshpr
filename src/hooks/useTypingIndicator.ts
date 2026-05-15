'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatRoom, TypingPayload } from '@/types/chat.types';

export function useTypingIndicator(room: ChatRoom | null, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

    return () => {
      void supabase.removeChannel(channel);
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      setTypingUsers(new Map());
    };
  }, [room?.id, room?.type, room?.eventId, room?.orgId, currentUserId]);

  return Array.from(typingUsers.values());
}
