'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';

export function ChatPageClient() {
  return (
    <div className='flex flex-col h-[calc(100vh-8rem)]'>
      <div className='mb-4 shrink-0'>
        <h1 className='text-xl font-semibold'>Chat</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          Team channels for your organization
        </p>
      </div>
      <div className='flex-1 min-h-0 border rounded-lg overflow-hidden'>
        <ChatPanel mode='org' />
      </div>
    </div>
  );
}
