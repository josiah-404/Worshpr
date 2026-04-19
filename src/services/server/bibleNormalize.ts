import type { Chapter, Verse } from '@/types/bible';
import { KJV_BIBLE_ID, KJV_BOOK_BY_ID, type RawKjvBook } from '@/data/kjv';

export const canonicalVerseId = (bookId: string, chapter: string | number, verse: string | number): string =>
  `${bookId}.${chapter}.${verse}`;

export const fullVerseId = (bibleId: string, bookId: string, chapter: string | number, verse: string | number): string =>
  `${bibleId}.${bookId}.${chapter}.${verse}`;

export const chapterIdOf = (bibleId: string, bookId: string, chapter: string | number): string =>
  `${bibleId}.${bookId}.${chapter}`;

export const parseChapterId = (
  chapterId: string,
): { bibleId: string; bookId: string; chapter: string } | null => {
  const parts = chapterId.split('.');
  if (parts.length < 3) return null;
  const chapter = parts.pop() as string;
  const bookId = parts.pop() as string;
  const bibleId = parts.join('.');
  if (!bibleId || !bookId || !chapter) return null;
  return { bibleId, bookId, chapter };
};

export const normalizeBundledChapter = (
  raw: RawKjvBook,
  bibleId: string,
  bookId: string,
  chapterNumber: string,
  copyright: string,
): Chapter | null => {
  const meta = KJV_BOOK_BY_ID[bookId];
  if (!meta) return null;
  const rawChapter = raw.chapters.find((c) => c.chapter === chapterNumber);
  if (!rawChapter) return null;

  const bookName = raw.book.trim() || meta.name;

  const verses: Verse[] = rawChapter.verses.map((v) => ({
    id: fullVerseId(bibleId, bookId, chapterNumber, v.verse),
    number: Number(v.verse),
    text: v.text,
  }));

  return {
    id: chapterIdOf(bibleId, bookId, chapterNumber),
    bibleId,
    bookId,
    bookName,
    number: chapterNumber,
    reference: `${bookName} ${chapterNumber}`,
    copyright,
    sections: [{ verses }],
  };
};

export const normalizeKjvChapter = (
  raw: RawKjvBook,
  bookId: string,
  chapterNumber: string,
): Chapter | null =>
  normalizeBundledChapter(
    raw,
    KJV_BIBLE_ID,
    bookId,
    chapterNumber,
    'King James Version — Public Domain',
  );
