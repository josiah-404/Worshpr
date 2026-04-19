'use client';

import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import type { BibleFontSize } from '@/types/bible';

const ORDER: BibleFontSize[] = ['sm', 'md', 'lg', 'xl'];

interface FontSizeToggleProps {
  size: BibleFontSize;
  onChange: (s: BibleFontSize) => void;
}

export const FontSizeToggle: FC<FontSizeToggleProps> = ({ size, onChange }) => {
  const next = () => {
    const idx = ORDER.indexOf(size);
    onChange(ORDER[(idx + 1) % ORDER.length]);
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={next}
      aria-label={`Font size: ${size}`}
      className="font-semibold"
    >
      <span className="text-xs">A</span>
      <span className="text-base">A</span>
    </Button>
  );
};
