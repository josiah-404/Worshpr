'use client';

import { type FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface ChapterNavProps {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
}

export const ChapterNav: FC<ChapterNavProps> = ({ onPrev, onNext, prevDisabled, nextDisabled }) => {
  const { state, isMobile } = useSidebar();

  const leftClass =
    isMobile
      ? 'left-2'
      : state === 'expanded'
        ? 'left-[calc(var(--sidebar-width)+0.5rem)]'
        : 'left-[calc(var(--sidebar-width-icon)+0.5rem)]';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label="Previous chapter"
        className={cn(
          'fixed top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background/80 backdrop-blur',
          leftClass,
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
