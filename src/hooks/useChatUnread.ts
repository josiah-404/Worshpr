'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrgContext } from '@/providers/OrgContext';
import { supabase, getChatChannelName } from '@/lib/supabase';
import type { ChatMessage } from '@/types/chat.types';

export function useChatUnread(): number {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { activeOrgId } = useOrgContext();
  const currentUserId = session?.user?.id;

  const [unread, setUnread] = useState(0);

  const onChatPage = pathname.startsWith('/chat');
  const onChatPageRef = useRef(onChatPage);
  onChatPageRef.current = onChatPage;

  useEffect(() => {
    if (onChatPage) setUnread(0);
  }, [onChatPage]);

  useEffect(() => {
    if (!activeOrgId || !currentUserId) return;

    const channel = supabase
      .channel(`unread:${getChatChannelName('org', activeOrgId)}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const msg = payload as unknown as ChatMessage;
          if (msg.senderId !== currentUserId && !onChatPageRef.current) {
            setUnread((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeOrgId, currentUserId]);

  return unread;
}
