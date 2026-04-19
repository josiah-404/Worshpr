'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import type { BibleFontSize, Chapter, HighlightColor } from '@/types/bible';
import { Verse } from './Verse';

interface ChapterViewProps {
  chapter: Chapter;
  selectedVerseIds: string[];
  onToggleVerse: (id: string) => void;
  getHighlight: (verseId: string) => HighlightColor | undefined;
  fontSize: BibleFontSize;
}

const FONT_SIZE_CLASS: Record<BibleFontSize, string> = {
  sm: 'text-base leading-7',
  md: 'text-lg leading-8',
  lg: 'text-xl leading-9',
  xl: 'text-2xl leading-[2.5rem]',
};

export const ChapterView: FC<ChapterViewProps> = ({
  chapter,
  selectedVerseIds,
  onToggleVerse,
  getHighlight,
  fontSize,
}) => {
  return (
    <article className={cn('font-serif text-foreground', FONT_SIZE_CLASS[fontSize])}>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {chapter.bookName}
        </h1>
        <p className="mt-1 text-sm font-sans text-muted-foreground">
          Chapter {chapter.number}
        </p>
      </header>

      {chapter.sections.map((section, idx) => (
        <section key={idx} className="mb-8">
          {section.heading ? (
            <h2 className="mb-3 font-sans text-base font-semibold tracking-tight text-foreground/90">
              {section.heading}
            </h2>
          ) : null}
          <p>
            {section.verses.map((v) => (
              <Verse
                key={v.id}
                verse={v}
                selected={selectedVerseIds.includes(v.id)}
                highlight={getHighlight(v.id)}
                onToggle={onToggleVerse}
              />
            ))}
          </p>
        </section>
      ))}

      {chapter.copyright ? (
        <p className="mt-10 font-sans text-xs text-muted-foreground">{chapter.copyright}</p>
      ) : null}
    </article>
  );
};
