'use client';

import { type FC, type CSSProperties, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat.types';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'] as const;

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  isOwn,
  currentUserId,
  onReact,
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [barStyle, setBarStyle] = useState<CSSProperties>({ position: 'fixed', top: -9999, left: -9999 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updateBarPosition = () => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    setBarStyle({
      position: 'fixed',
      top: rect.top - 44,
      ...(isOwn ? { right: window.innerWidth - rect.right } : { left: rect.left }),
      zIndex: 9999,
    });
  };

  const handleMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updateBarPosition();
    setShowEmoji(true);
  };

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setShowEmoji(false), 200);
  };

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  const hasReactions = message.reactions.length > 0;

  const emojiBar = mounted
    ? createPortal(
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={barStyle}
          className={cn(
            'transition-[opacity,transform] duration-150 ease-out',
            showEmoji
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-90 pointer-events-none',
          )}
        >
          <div className='flex items-center gap-0.5 rounded-full border bg-popover px-1.5 py-1 shadow-md'>
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className='rounded-full p-0.5 text-base leading-none transition-transform duration-100 hover:scale-125 focus:outline-none'
                type='button'
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={cn('flex flex-col gap-1 w-full min-w-0', isOwn ? 'items-end' : 'items-start')}>
      {!isOwn && (
        <span className='text-xs font-medium text-muted-foreground px-1'>
          {message.senderName}
        </span>
      )}

      <div className='max-w-[75%]'>
        <div
          ref={bubbleRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
          )}
        >
          {message.content}
        </div>

        {hasReactions && (
          <div className={cn('mt-1 flex flex-wrap gap-1', isOwn ? 'justify-end' : 'justify-start')}>
            {message.reactions.map((group) => {
              const reacted = group.userIds.includes(currentUserId);
              return (
                <button
                  key={group.emoji}
                  onClick={() => onReact(message.id, group.emoji)}
                  type='button'
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    reacted
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-muted/60 text-foreground hover:bg-muted',
                  )}
                >
                  <span>{group.emoji}</span>
                  <span className='font-medium'>{group.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <span className='text-[10px] text-muted-foreground px-1'>{timeAgo}</span>

      {emojiBar}
    </div>
  );
};
