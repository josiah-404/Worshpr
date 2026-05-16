'use client';

import { type FC, useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage } from '@/hooks/useSendMessage';
import type { ChatRoom } from '@/types/chat.types';

interface MessageInputProps {
  room: ChatRoom;
  onTyping?: () => void;
}

export const MessageInput: FC<MessageInputProps> = ({ room, onTyping }) => {
  const [content, setContent] = useState('');
  const { mutate, isPending } = useSendMessage(room.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;
    mutate(
      { content: trimmed },
      { onSuccess: () => setContent('') },
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='flex items-end gap-2 border-t p-3'>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onTyping?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder='Type a message… (Enter to send)'
        rows={1}
        className='min-h-0 resize-none flex-1 overflow-y-auto'
        disabled={isPending}
      />
      <Button
        size='icon'
        onClick={handleSend}
        disabled={!content.trim() || isPending}
        className='shrink-0'
      >
        <Send className='h-4 w-4' />
      </Button>
    </div>
  );
};
