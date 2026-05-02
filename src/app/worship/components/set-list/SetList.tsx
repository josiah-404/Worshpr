'use client';

import { type FC } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { SongResult } from '@/types/worship.types';
import { SetListItem } from './SetListItem';

interface SetListProps {
  songQueue: SongResult[];
  editingIdx: number | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editArtist: string;
  setEditArtist: (v: string) => void;
  editRole: string;
  setEditRole: (v: string) => void;
  editLyrics: string;
  setEditLyrics: (v: string) => void;
  onStartEdit: (idx: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (idx: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const SetList: FC<SetListProps> = ({
  songQueue,
  editingIdx,
  editTitle,
  setEditTitle,
  editArtist,
  setEditArtist,
  editRole,
  setEditRole,
  editLyrics,
  setEditLyrics,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onDragEnd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = songQueue.map((_, i) => String(i));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className='flex flex-col gap-1'>
          {songQueue.map((song, i) => (
            <SetListItem
              key={`${song.title}-${song.artist}-${i}`}
              id={String(i)}
              song={song}
              index={i}
              editingIdx={editingIdx}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editArtist={editArtist}
              setEditArtist={setEditArtist}
              editRole={editRole}
              setEditRole={setEditRole}
              editLyrics={editLyrics}
              setEditLyrics={setEditLyrics}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
