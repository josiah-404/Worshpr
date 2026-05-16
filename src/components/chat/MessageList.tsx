'use client';

import { type FC, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { ChatMessage } from '@/types/chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId: string;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  currentUserId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onReact,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef<number | null>(null);
  const isFirstLoad = useRef(true);
  const prevMessageCount = useRef(0);

  // Scroll to bottom only on initial load
  useEffect(() => {
    if (!isLoading && isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    }
  }, [isLoading, messages.length]);

  // Also scroll to bottom when live messages arrive (message count increases from the front)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFirstLoad.current) return;

    const newCount = messages.length;
    const oldCount = prevMessageCount.current;
    prevMessageCount.current = newCount;

    if (newCount <= oldCount) return;

    // Only auto-scroll if user is near the bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Restore scroll position after older messages are prepended
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || scrollHeightBeforeLoad.current === null) return;

    const diff = container.scrollHeight - scrollHeightBeforeLoad.current;
    container.scrollTop += diff;
    scrollHeightBeforeLoad.current = null;
  });

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage || !fetchNextPage) return;

    if (container.scrollTop <= 100) {
      scrollHeightBeforeLoad.current = container.scrollHeight;
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className='flex flex-col gap-3 p-4 overflow-y-auto overflow-x-hidden flex-1'
    >
      {isFetchingNextPage && (
        <div className='flex justify-center py-2'>
          <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
        </div>
      )}
      {ordered.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          currentUserId={currentUserId}
          onReact={onReact}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
