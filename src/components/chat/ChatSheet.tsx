'use client';

import { type FC } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChatPanel } from '@/components/chat/ChatPanel';

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatSheet: FC<ChatSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex flex-col p-0 sm:max-w-md w-full gap-0'>
        <SheetHeader className='px-4 py-3 border-b shrink-0'>
          <SheetTitle className='text-sm'>Team Chat</SheetTitle>
        </SheetHeader>
        <div className='flex-1 min-h-0 overflow-hidden'>
          <ChatPanel mode='org' />
        </div>
      </SheetContent>
    </Sheet>
  );
};
