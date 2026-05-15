'use client';

import { type FC, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useEventRoom } from '@/hooks/useEventRoom';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingChannel } from '@/hooks/useTypingChannel';
import type { ChatRoom } from '@/types/chat.types';

interface OrgModeProps {
  mode: 'org';
  eventId?: never;
}

interface EventModeProps {
  mode: 'event';
  eventId: string;
}

type ChatPanelProps = OrgModeProps | EventModeProps;

function OrgChatPanel({ currentUserId }: { currentUserId: string }) {
  const { data: rooms = [], isLoading } = useChatRooms();
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

  const resolvedRoom = activeRoom ?? (rooms.length > 0 ? rooms[0] : null);
  const { messages, isLoading: messagesLoading } = useChatMessages(resolvedRoom);
  const { typingNames, broadcastTyping } = useTypingChannel(resolvedRoom, currentUserId);

  if (isLoading) {
    return (
      <div className='flex h-full gap-2 p-4'>
        <Skeleton className='w-44 h-full rounded-lg' />
        <Skeleton className='flex-1 h-full rounded-lg' />
      </div>
    );
  }

  return (
    <div className='flex h-full overflow-hidden'>
      <div className='w-48 shrink-0 border-r overflow-hidden flex flex-col'>
        <ChatRoomList
          rooms={rooms}
          activeRoomId={resolvedRoom?.id ?? null}
          onSelect={setActiveRoom}
        />
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        {resolvedRoom ? (
          <>
            <div className='flex items-center gap-2 border-b px-4 py-2.5 shrink-0'>
              <span className='text-sm font-semibold'>#{resolvedRoom.name}</span>
            </div>
            <MessageList
              messages={messages}
              isLoading={messagesLoading}
              currentUserId={currentUserId}
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
  const { messages, isLoading: messagesLoading } = useChatMessages(room ?? null);
  const { typingNames, broadcastTyping } = useTypingChannel(room ?? null, currentUserId);

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
