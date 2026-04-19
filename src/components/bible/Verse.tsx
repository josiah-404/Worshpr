'use client';

import { type FC, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { HighlightColor, Verse as VerseType } from '@/types/bible';

const HIGHLIGHT_CLASS: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-200/70 dark:bg-yellow-500/25',
  green: 'bg-green-200/70 dark:bg-green-500/25',
  blue: 'bg-sky-200/70 dark:bg-sky-500/25',
  pink: 'bg-pink-200/70 dark:bg-pink-500/25',
  purple: 'bg-purple-200/70 dark:bg-purple-500/25',
};

interface VerseProps {
  verse: VerseType;
  selected: boolean;
  highlight?: HighlightColor;
  onToggle: (id: string) => void;
}

export const Verse: FC<VerseProps> = ({ verse, selected, highlight, onToggle }) => {
  const handleKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(verse.id);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onToggle(verse.id)}
      onKeyDown={handleKey}
      className={cn(
        'cursor-pointer rounded-sm px-0.5 transition-colors',
        highlight && HIGHLIGHT_CLASS[highlight],
        selected && 'bg-amber-200/80 ring-1 ring-amber-500/60 dark:bg-amber-400/30',
      )}
    >
      <sup className="mr-1 select-none text-[0.65em] font-semibold text-muted-foreground">
        {verse.number}
      </sup>
      {verse.text}{' '}
    </span>
  );
};
