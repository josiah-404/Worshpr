'use client';

import { type FC, useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgContext } from '@/providers/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createOrgRoom } from '@/services/chat.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { ChatRoom } from '@/types/chat.types';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelect: (room: ChatRoom) => void;
  unreadCounts: Record<string, number>;
}

export const ChatRoomList: FC<ChatRoomListProps> = ({ rooms, activeRoomId, onSelect, unreadCounts }) => {
  const { data: session } = useSession();
  const role = session?.user?.role ?? 'officer';
  const canCreate = role === 'super_admin' || role === 'org_admin';
  const { activeOrgId } = useOrgContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createOrgRoom,
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHAT_ROOMS] });
      setDialogOpen(false);
      setRoomName('');
      onSelect(newRoom);
    },
  });

  const handleCreate = () => {
    const trimmed = roomName.trim();
    if (!trimmed || isPending) return;
    mutate({ name: trimmed, orgId: activeOrgId ?? undefined });
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between px-3 py-2 border-b'>
        <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Channels
        </span>
        {canCreate && (
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={() => setDialogOpen(true)}
          >
            <Plus className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>

      <div className='flex-1 overflow-y-auto py-1'>
        {rooms.length === 0 ? (
          <p className='px-3 py-4 text-xs text-muted-foreground'>No channels yet.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelect(room)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                activeRoomId === room.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Hash className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate flex-1'>{room.name}</span>
              {(unreadCounts[room.id] ?? 0) > 0 && (
                <span className='ml-auto shrink-0 min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold text-primary-foreground'>
                  {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-xs'>
          <DialogHeader>
            <DialogTitle>New Channel</DialogTitle>
          </DialogHeader>
          <Input
            placeholder='channel-name'
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!roomName.trim() || isPending} className='w-full'>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
