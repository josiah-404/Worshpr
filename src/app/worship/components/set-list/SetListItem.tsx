'use client';

import { type FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, BookOpen } from 'lucide-react';
import type { SongResult } from '@/types/worship.types';
import { Textarea } from '@/components/ui/textarea';

interface SetListItemProps {
  song: SongResult;
  index: number;
  id: string;
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
}

export const SetListItem: FC<SetListItemProps> = ({
  song: s,
  index: i,
  id,
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingIdx === i;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='rounded-md bg-background border border-border/60 overflow-hidden'
    >
      {isEditing ? (
        /* ── Inline edit form ── */
        <div className='flex flex-col gap-1.5 p-2'>
          {s.isSection ? (
            <input
              type='text'
              placeholder='Section label *'
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              autoFocus
              className='w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring'
            />
          ) : (
            <>
              <input
                type='text'
                placeholder='Role (e.g. Opening Song)'
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className='w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring'
              />
              <div className='grid grid-cols-2 gap-1.5'>
                <input
                  type='text'
                  placeholder='Song title *'
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  autoFocus
                  className='rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring'
                />
                <input
                  type='text'
                  placeholder='Artist'
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  className='rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring'
                />
              </div>
              <Textarea
                placeholder='Lyrics (separate slides with a blank line)'
                value={editLyrics}
                onChange={(e) => setEditLyrics(e.target.value)}
                className='min-h-[120px] resize-y text-xs'
              />
            </>
          )}
          <div className='flex items-center justify-end gap-1.5'>
            <button
              onClick={onCancelEdit}
              className='rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={onSaveEdit}
              disabled={!editTitle.trim()}
              className='rounded bg-primary text-primary-foreground px-2 py-1 text-[11px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Save
            </button>
          </div>
        </div>
      ) : s.isSection ? (
        /* ── Section row ── */
        <div className='flex items-center gap-1 px-1 py-1.5'>
          <button
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 touch-none'
            aria-label='Drag to reorder'
          >
            <GripVertical className='h-3.5 w-3.5' />
          </button>
          <span className='text-[11px] font-mono text-muted-foreground/60 w-4 shrink-0'>
            {i + 1}
          </span>
          <div className='flex items-center gap-1.5 flex-1 min-w-0'>
            <BookOpen className='h-3 w-3 text-muted-foreground/50 shrink-0' />
            <p className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate'>
              {s.title}
            </p>
          </div>
          <button
            onClick={() => onStartEdit(i)}
            className='text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors shrink-0'
            aria-label='Edit'
          >
            ✎
          </button>
          <button
            onClick={() => onRemove(i)}
            className='text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors shrink-0 pr-1'
            aria-label='Remove'
          >
            ✕
          </button>
        </div>
      ) : (
        /* ── Song row ── */
        <div className='flex items-center gap-1 px-1 py-1.5'>
          <button
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 touch-none'
            aria-label='Drag to reorder'
          >
            <GripVertical className='h-3.5 w-3.5' />
          </button>
          <span className='text-[11px] font-mono text-muted-foreground/60 w-4 shrink-0'>
            {i + 1}
          </span>
          <div className='flex-1 min-w-0'>
            {s.role && (
              <p className='text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate leading-none mb-0.5'>
                {s.role}
              </p>
            )}
            <p className='text-xs font-medium truncate'>{s.title}</p>
            <p className='text-[11px] text-muted-foreground truncate'>
              {s.artist}
            </p>
          </div>
          <button
            onClick={() => onStartEdit(i)}
            className='text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors shrink-0'
            aria-label='Edit'
          >
            ✎
          </button>
          <button
            onClick={() => onRemove(i)}
            className='text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors shrink-0 pr-1'
            aria-label='Remove'
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
