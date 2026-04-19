'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import type { HighlightColor } from '@/types/bible';

const COLORS: { key: HighlightColor; swatch: string; label: string }[] = [
  { key: 'yellow', swatch: 'bg-yellow-300', label: 'Yellow' },
  { key: 'green', swatch: 'bg-green-300', label: 'Green' },
  { key: 'blue', swatch: 'bg-sky-300', label: 'Blue' },
  { key: 'pink', swatch: 'bg-pink-300', label: 'Pink' },
  { key: 'purple', swatch: 'bg-purple-300', label: 'Purple' },
];

interface HighlightPaletteProps {
  onPick: (color: HighlightColor) => void;
  onClear: () => void;
}

export const HighlightPalette: FC<HighlightPaletteProps> = ({ onPick, onClear }) => {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-label={`Highlight ${c.label}`}
          onClick={() => onPick(c.key)}
          className={cn(
            'size-6 rounded-full border border-foreground/10 transition-transform hover:scale-110',
            c.swatch,
          )}
        />
      ))}
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove highlight"
        className="size-6 rounded-full border border-dashed border-muted-foreground text-[10px] font-semibold text-muted-foreground hover:bg-accent"
      >
        ×
      </button>
    </div>
  );
};
