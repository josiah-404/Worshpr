'use client';

import { type FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChapterNavProps {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
}

export const ChapterNav: FC<ChapterNavProps> = ({ onPrev, onNext, prevDisabled, nextDisabled }) => {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label="Previous chapter"
        className={cn(
          'fixed left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background/80 backdrop-blur',
          'sm:left-4',
        )}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Next chapter"
        className={cn(
          'fixed right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background/80 backdrop-blur',
          'sm:right-4',
        )}
      >
        <ChevronRight />
      </Button>
    </>
  );
};
