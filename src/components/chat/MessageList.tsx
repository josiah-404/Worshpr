'use client';

import { type FC, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { ChatMessage } from '@/types/chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId: string;
}

export const MessageList: FC<MessageListProps> = ({ messages, isLoading, currentUserId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3 p-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className='h-10 w-48 rounded-2xl' />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
        No messages yet. Start the conversation!
      </div>
    );
  }

  const ordered = [...messages].reverse();

  return (
    <div className='flex flex-col gap-3 p-4 overflow-y-auto flex-1'>
      {ordered.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
