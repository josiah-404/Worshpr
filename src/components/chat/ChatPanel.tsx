'use client';

import { type FC, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Hash, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useEventRoom } from '@/hooks/useEventRoom';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingChannel } from '@/hooks/useTypingChannel';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { toggleReaction } from '@/services/chat.service';
import type { ChatRoom, ChatMessage, ReactionGroup } from '@/types/chat.types';

function buildOptimisticReactions(
  msg: ChatMessage,
  emoji: string,
  currentUserId: string,
): ReactionGroup[] {
  const isSame = msg.reactions.find((r) => r.emoji === emoji)?.userIds.includes(currentUserId);

  // Remove current user from ALL groups first (one reaction per user)
  let updated = msg.reactions
    .map((r) => ({
      ...r,
      userIds: r.userIds.filter((id) => id !== currentUserId),
      count: r.userIds.filter((id) => id !== currentUserId).length,
    }))
    .filter((r) => r.count > 0);

  if (!isSame) {
    // Add to target emoji
    const target = updated.find((r) => r.emoji === emoji);
    if (target) {
      updated = updated.map((r) =>
        r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUserId] } : r,
      );
    } else {
      updated = [...updated, { emoji, count: 1, userIds: [currentUserId] }];
    }
  }

  return updated;
}

interface OrgModeProps {
  mode: 'org';
  eventId?: never;
}

interface EventModeProps {
  mode: 'event';
  eventId: string;
}

type ChatPanelProps = OrgModeProps | EventModeProps;

function ChatLoadingSkeleton() {
  return (
    <div className='flex h-full overflow-hidden'>
      <div className='w-48 shrink-0 border-r p-3 flex flex-col gap-2'>
        <Skeleton className='h-4 w-24 mb-2' />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center gap-2'>
            <Skeleton className='h-3.5 w-3.5 rounded-sm' />
            <Skeleton className={`h-3.5 rounded ${i % 3 === 0 ? 'w-20' : i % 3 === 1 ? 'w-28' : 'w-16'}`} />
          </div>
        ))}
      </div>
      <div className='flex-1 flex flex-col gap-3 p-4'>
        {[
          { own: false, w: 'w-48' },
          { own: true, w: 'w-56' },
          { own: false, w: 'w-40' },
          { own: true, w: 'w-64' },
          { own: false, w: 'w-52' },
          { own: true, w: 'w-36' },
          { own: false, w: 'w-60' },
        ].map((item, i) => (
          <div key={i} className={`flex ${item.own ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-10 ${item.w} rounded-2xl`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgChatPanel({ currentUserId }: { currentUserId: string }) {
  const { data: rooms = [], isLoading } = useChatRooms();
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

  const resolvedRoom = activeRoom ?? (rooms.length > 0 ? rooms[0] : null);
  const { messages, isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage, patchReactions } = useChatMessages(resolvedRoom);
  const { typingNames, broadcastTyping } = useTypingChannel(resolvedRoom, currentUserId);
  const unreadCounts = useUnreadCounts(rooms, resolvedRoom?.id ?? null);

  const { mutate: reactMutate } = useMutation({ mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => toggleReaction(messageId, emoji) });
  const handleReact = useCallback((messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) { reactMutate({ messageId, emoji }); return; }
    const optimistic = buildOptimisticReactions(msg, emoji, currentUserId);
    patchReactions(messageId, optimistic);
    reactMutate({ messageId, emoji }, { onError: () => patchReactions(messageId, msg.reactions) });
  }, [messages, currentUserId, patchReactions, reactMutate]);

  if (isLoading) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className='flex h-full overflow-hidden'>
      <div className='w-48 shrink-0 border-r overflow-hidden flex flex-col'>
        <ChatRoomList
          rooms={rooms}
          activeRoomId={resolvedRoom?.id ?? null}
          onSelect={setActiveRoom}
          unreadCounts={unreadCounts}
        />
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        {resolvedRoom ? (
          <>
            <div className='flex items-center gap-2 border-b px-4 py-2.5 shrink-0'>
              <Hash className='h-3.5 w-3.5 text-muted-foreground' />
              <span className='text-sm font-semibold'>{resolvedRoom.name}</span>
            </div>
            <MessageList
              messages={messages}
              isLoading={messagesLoading}
              currentUserId={currentUserId}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onReact={handleReact}
            />
            <TypingIndicator names={typingNames} />
            <MessageInput room={resolvedRoom} onTyping={broadcastTyping} />
          </>
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
            <MessageSquare className='h-8 w-8 opacity-40' />
            <p>No channels yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventChatPanel({ eventId, currentUserId }: { eventId: string; currentUserId: string }) {
  const { data: room, isLoading: roomLoading } = useEventRoom(eventId);
  const { messages, isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage, patchReactions } = useChatMessages(room ?? null);
  const { typingNames, broadcastTyping } = useTypingChannel(room ?? null, currentUserId);

  const { mutate: reactMutate } = useMutation({ mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => toggleReaction(messageId, emoji) });
  const handleReact = useCallback((messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) { reactMutate({ messageId, emoji }); return; }
    const optimistic = buildOptimisticReactions(msg, emoji, currentUserId);
    patchReactions(messageId, optimistic);
    reactMutate({ messageId, emoji }, { onError: () => patchReactions(messageId, msg.reactions) });
  }, [messages, currentUserId, patchReactions, reactMutate]);

  if (roomLoading) {
    return <Skeleton className='h-full w-full rounded-lg' />;
  }

  if (!room) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
        Could not load event chat.
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <MessageList
        messages={messages}
        isLoading={messagesLoading}
        currentUserId={currentUserId}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onReact={handleReact}
      />
      <TypingIndicator names={typingNames} />
      <MessageInput room={room} onTyping={broadcastTyping} />
    </div>
  );
}

export const ChatPanel: FC<ChatPanelProps> = ({ mode, eventId }) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? '';

  if (mode === 'event' && eventId) {
    return <EventChatPanel eventId={eventId} currentUserId={currentUserId} />;
  }

  return <OrgChatPanel currentUserId={currentUserId} />;
};
