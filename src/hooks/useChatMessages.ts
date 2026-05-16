'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getRoomMessages } from '@/services/chat.service';
import { supabase, getChatChannelName } from '@/lib/supabase';
import { QUERY_KEYS } from '@/lib/constants';
import type { ChatRoom, ChatMessage, ReactionGroup } from '@/types/chat.types';
import type { InfiniteData } from '@tanstack/react-query';

type MessagesPage = { messages: ChatMessage[]; hasMore: boolean };

export function useChatMessages(room: ChatRoom | null) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.CHAT_MESSAGES, room?.id],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getRoomMessages(room!.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      const oldest = lastPage.messages[lastPage.messages.length - 1];
      return oldest?.createdAt;
    },
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
            return [{ ...msg, reactions: msg.reactions ?? [] }, ...prev];
          });
        },
      )
      .on(
        'broadcast',
        { event: 'reaction_update' },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const { messageId, reactions } = payload as {
            messageId: string;
            reactions: ReactionGroup[];
          };

          setLiveMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
          );

          queryClient.setQueryData<InfiniteData<MessagesPage>>(
            [QUERY_KEYS.CHAT_MESSAGES, room.id],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((m) =>
                    m.id === messageId ? { ...m, reactions } : m,
                  ),
                })),
              };
            },
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id, room?.type, room?.eventId, room?.orgId, queryClient]);

  const patchReactions = useCallback(
    (messageId: string, reactions: ReactionGroup[]) => {
      setLiveMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      );
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        [QUERY_KEYS.CHAT_MESSAGES, room?.id],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === messageId ? { ...m, reactions } : m,
              ),
            })),
          };
        },
      );
    },
    [queryClient, room?.id],
  );

  const history = data?.pages.flatMap((p) => p.messages) ?? [];
  const messages: ChatMessage[] = [...liveMessages, ...history];

  return { messages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, patchReactions };
}
