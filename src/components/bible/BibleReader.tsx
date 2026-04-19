'use client';

import { useEffect, useMemo, type FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBible } from '@/providers/BibleProvider';
import { useBibleVersions } from '@/hooks/useBibleVersions';
import { useBibleBooks } from '@/hooks/useBibleBooks';
import { useBibleChapter } from '@/hooks/useBibleChapter';
import { useBibleHighlights } from '@/hooks/useBibleHighlights';
import type { HighlightColor } from '@/types/bible';
import { BibleHeader } from './BibleHeader';
import { ChapterView } from './ChapterView';
import { ChapterNav } from './ChapterNav';
import { VerseActionBar } from './VerseActionBar';
import { BookChapterPicker } from './BookChapterPicker';
import { VersionPicker } from './VersionPicker';

const parseChapterId = (id: string): { bookId: string; chapter: string } | null => {
  const parts = id.split('.');
  if (parts.length < 3) return null;
  return { bookId: parts[parts.length - 2], chapter: parts[parts.length - 1] };
};

export const BibleReader: FC = () => {
  const {
    versionId,
    setVersionId,
    bookId,
    chapterNumber,
    setLocation,
    selectedVerseIds,
    toggleVerse,
    clearSelection,
    pickerOpen,
    setPickerOpen,
    fontSize,
  } = useBible();

  const { data: versions } = useBibleVersions();
  const { data: books } = useBibleBooks(versionId);
  const { setHighlight, removeHighlight, getColor } = useBibleHighlights();

  const currentVersion = useMemo(
    () => versions?.find((v) => v.id === versionId),
    [versions, versionId],
  );
  const currentBook = useMemo(
    () => books?.find((b) => b.id === bookId),
    [books, bookId],
  );

  const chapterId = `${versionId}.${bookId}.${chapterNumber}`;
  const { data: chapter, isLoading, isError } = useBibleChapter(chapterId);

  // If current book/chapter isn't valid for the active version, clamp to book Gen 1 / first book ch 1.
  useEffect(() => {
    if (!books || books.length === 0) return;
    if (!books.find((b) => b.id === bookId)) {
      const first = books[0];
      setLocation(first.id, '1');
      return;
    }
    const book = books.find((b) => b.id === bookId);
    if (book && Number(chapterNumber) > book.chapterCount) {
      setLocation(book.id, '1');
    }
  }, [books, bookId, chapterNumber, setLocation]);

  const selectedVerses = useMemo(() => {
    if (!chapter) return [];
    const all = chapter.sections.flatMap((s) => s.verses);
    return all.filter((v) => selectedVerseIds.includes(v.id));
  }, [chapter, selectedVerseIds]);

  const goNeighbor = (id?: string) => {
    if (!id) return;
    const parsed = parseChapterId(id);
    if (!parsed) return;
    setLocation(parsed.bookId, parsed.chapter);
  };

  const handleHighlight = (color: HighlightColor) => {
    for (const v of selectedVerses) setHighlight(v.id, color);
    clearSelection();
  };

  const handleClearHighlight = () => {
    for (const v of selectedVerses) removeHighlight(v.id);
    clearSelection();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BibleHeader book={currentBook} version={currentVersion} />

      <main className="relative flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-40 sm:px-8">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : isError || !chapter ? (
            <p className="text-sm text-muted-foreground">
              Could not load this chapter. Try another selection.
            </p>
          ) : (
            <ChapterView
              chapter={chapter}
              selectedVerseIds={selectedVerseIds}
              onToggleVerse={toggleVerse}
              getHighlight={getColor}
              fontSize={fontSize}
            />
          )}
        </div>

        {chapter ? (
          <ChapterNav
            onPrev={() => goNeighbor(chapter.prevId)}
            onNext={() => goNeighbor(chapter.nextId)}
            prevDisabled={!chapter.prevId}
            nextDisabled={!chapter.nextId}
          />
        ) : null}
      </main>

      {chapter && currentVersion ? (
        <VerseActionBar
          chapter={chapter}
          versionAbbreviation={currentVersion.abbreviation}
          selectedVerses={selectedVerses}
          onClose={clearSelection}
          onHighlight={handleHighlight}
          onClearHighlight={handleClearHighlight}
        />
      ) : null}

      <BookChapterPicker
        open={pickerOpen === 'book'}
        onOpenChange={(v) => setPickerOpen(v ? 'book' : null)}
        bibleId={versionId}
        currentBookId={bookId}
        onPick={(b, c) => setLocation(b, c)}
      />
      <VersionPicker
        open={pickerOpen === 'version'}
        onOpenChange={(v) => setPickerOpen(v ? 'version' : null)}
        currentVersionId={versionId}
        onPick={setVersionId}
      />
    </div>
  );
};
