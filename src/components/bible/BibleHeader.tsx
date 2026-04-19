'use client';

import { type FC } from 'react';
import { ChevronDown, Columns2, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FontSizeToggle } from './FontSizeToggle';
import { useBible } from '@/providers/BibleProvider';
import type { BibleVersion, Book } from '@/types/bible';

interface BibleHeaderProps {
  book?: Book;
  version?: BibleVersion;
  loading?: boolean;
}

export const BibleHeader: FC<BibleHeaderProps> = ({ book, version, loading }) => {
  const { chapterNumber, setPickerOpen, fontSize, setFontSize } = useBible();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/90 px-3 py-2 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        {loading ? (
          <>
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={() => setPickerOpen('book')}
              className="max-w-[55vw] truncate text-base font-semibold"
            >
              <span className="truncate">
                {book ? `${book.name} ${chapterNumber}` : 'Select book'}
              </span>
              <ChevronDown />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen('version')}
              className="font-semibold"
            >
              {version?.abbreviation ?? '—'}
              <ChevronDown />
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="ghost" size="icon" disabled aria-label="Parallel view">
                  <Columns2 />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Parallel view — coming soon</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="ghost" size="icon" disabled aria-label="Audio">
                  <Headphones />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Audio — coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <FontSizeToggle size={fontSize} onChange={setFontSize} />
      </div>
    </header>
  );
};
