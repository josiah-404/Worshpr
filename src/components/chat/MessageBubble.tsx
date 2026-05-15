import { type FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const MessageBubble: FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      {!isOwn && (
        <span className='text-xs font-medium text-muted-foreground px-1'>
          {message.senderName}
        </span>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {message.content}
      </div>
      <span className='text-[10px] text-muted-foreground px-1'>{timeAgo}</span>
    </div>
  );
};
