'use client';

import { type FC } from 'react';
import { Copy, Columns2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Chapter, HighlightColor, Verse } from '@/types/bible';
import { HighlightPalette } from './HighlightPalette';
import { useCopyVerses } from '@/hooks/useCopyVerses';
import { useShareVerses } from '@/hooks/useShareVerses';

interface VerseActionBarProps {
  chapter: Chapter;
  versionAbbreviation: string;
  selectedVerses: Verse[];
  onClose: () => void;
  onHighlight: (color: HighlightColor) => void;
  onClearHighlight: () => void;
}

const buildReferenceLabel = (
  chapter: Chapter,
  verses: Verse[],
  abbr: string,
): string => {
  if (verses.length === 0) return '';
  const numbers = verses.map((v) => v.number).sort((a, b) => a - b);
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  const contiguous = numbers.every((n, i) => n === first + i);
  const range = contiguous && first !== last ? `${first}-${last}` : numbers.join(',');
  return `${chapter.bookName} ${chapter.number}:${range} ${abbr}`;
};

export const VerseActionBar: FC<VerseActionBarProps> = ({
  chapter,
  versionAbbreviation,
  selectedVerses,
  onClose,
  onHighlight,
  onClearHighlight,
}) => {
  const copy = useCopyVerses();
  const share = useShareVerses();

  if (selectedVerses.length === 0) return null;
  const label = buildReferenceLabel(chapter, selectedVerses, versionAbbreviation);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-lg backdrop-blur animate-in slide-in-from-bottom-4 duration-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{label}</p>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Clear selection">
            <X />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <HighlightPalette onPick={onHighlight} onClear={onClearHighlight} />

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copy({
                  chapter,
                  versionAbbreviation,
                  verses: selectedVerses,
                })
              }
            >
              <Copy />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      <Columns2 />
                      <span className="hidden sm:inline">Compare</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                share({
                  chapter,
                  versionAbbreviation,
                  verses: selectedVerses,
                })
              }
            >
              <Share2 />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
