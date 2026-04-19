import type { BibleVersion, Book, Chapter } from '@/types/bible';
import {
  KJV_BIBLE_ID,
  KJV_BOOKS,
  KJV_BOOK_BY_ID,
  getKjvBooks,
  loadKjvBook,
} from '@/data/kjv';
import { chapterIdOf, normalizeKjvChapter, parseChapterId } from './bibleNormalize';

const KJV_VERSION: BibleVersion = {
  id: KJV_BIBLE_ID,
  abbreviation: 'KJV',
  name: 'King James Version',
  language: { id: 'eng', name: 'English', nameLocal: 'English' },
  description: 'King James Version (1769). Public Domain.',
  isFallback: true,
};

export const fallbackListVersions = (): BibleVersion[] => [KJV_VERSION];

export const fallbackListBooks = (bibleId: string): Book[] => {
  if (bibleId !== KJV_BIBLE_ID) return [];
  return getKjvBooks();
};

const neighborChapterId = (bookId: string, chapter: number, offset: number): string | undefined => {
  const bookIndex = KJV_BOOKS.findIndex((b) => b.id === bookId);
  if (bookIndex < 0) return undefined;
  const book = KJV_BOOKS[bookIndex];
  const target = chapter + offset;
  if (target >= 1 && target <= book.chapterCount) {
    return chapterIdOf(KJV_BIBLE_ID, book.id, target);
  }
  if (offset < 0 && bookIndex > 0) {
    const prev = KJV_BOOKS[bookIndex - 1];
    return chapterIdOf(KJV_BIBLE_ID, prev.id, prev.chapterCount);
  }
  if (offset > 0 && bookIndex < KJV_BOOKS.length - 1) {
    const next = KJV_BOOKS[bookIndex + 1];
    return chapterIdOf(KJV_BIBLE_ID, next.id, 1);
  }
  return undefined;
};

export const fallbackGetChapter = async (chapterId: string): Promise<Chapter | null> => {
  const parsed = parseChapterId(chapterId);
  if (!parsed) return null;
  if (parsed.bibleId !== KJV_BIBLE_ID) return null;
  if (!KJV_BOOK_BY_ID[parsed.bookId]) return null;

  const raw = await loadKjvBook(parsed.bookId);
  if (!raw) return null;
  const chapter = normalizeKjvChapter(raw, parsed.bookId, parsed.chapter);
  if (!chapter) return null;

  const chNum = Number(parsed.chapter);
  return {
    ...chapter,
    prevId: neighborChapterId(parsed.bookId, chNum, -1),
    nextId: neighborChapterId(parsed.bookId, chNum, +1),
  };
};
