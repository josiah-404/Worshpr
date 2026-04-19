import type { BibleVersion, Book, Chapter } from '@/types/bible';
import {
  KJV_BIBLE_ID,
  KJV_BOOKS,
  KJV_BOOK_BY_ID,
  loadKjvBook,
  type RawKjvBook,
} from '@/data/kjv';
import { ESV_BIBLE_ID, loadEsvBook } from '@/data/esv';
import { MBBTAG12_BIBLE_ID, loadMbbtag12Book } from '@/data/mbbtag12';
import { chapterIdOf, normalizeBundledChapter, parseChapterId } from './bibleNormalize';

const KJV_VERSION: BibleVersion = {
  id: KJV_BIBLE_ID,
  abbreviation: 'KJV',
  name: 'King James Version',
  language: { id: 'eng', name: 'English', nameLocal: 'English' },
  description: 'King James Version (1769). Public Domain.',
  isFallback: true,
};

const ESV_VERSION: BibleVersion = {
  id: ESV_BIBLE_ID,
  abbreviation: 'ESV',
  name: 'English Standard Version',
  language: { id: 'eng', name: 'English', nameLocal: 'English' },
  description: 'English Standard Version®. Bundled offline.',
  isFallback: true,
};

const MBBTAG12_VERSION: BibleVersion = {
  id: MBBTAG12_BIBLE_ID,
  abbreviation: 'MBBTAG12',
  name: 'Magandang Balita Biblia (Tagalog) 2012',
  language: { id: 'tgl', name: 'Tagalog', nameLocal: 'Tagalog' },
  description: 'Magandang Balita Biblia 2012. Bundled offline.',
  isFallback: true,
};

export const BUNDLED_BIBLE_IDS = [KJV_BIBLE_ID, ESV_BIBLE_ID, MBBTAG12_BIBLE_ID] as const;

const bundledSet = new Set<string>(BUNDLED_BIBLE_IDS);

export const isBundledBibleId = (id: string): boolean => bundledSet.has(id);

const COPYRIGHT_BY_BIBLE_ID: Record<string, string> = {
  [KJV_BIBLE_ID]: 'King James Version — Public Domain',
  [ESV_BIBLE_ID]:
    'The Holy Bible, English Standard Version® (ESV®), copyright © 2001 by Crossway Bibles, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
  [MBBTAG12_BIBLE_ID]:
    'Magandang Balita Biblia (Tagalog) 2012 — Old Testament © 2005 Philippine Bible Society; New Testament © 2012 Philippine Bible Society.',
};

export const fallbackListVersions = (): BibleVersion[] => [KJV_VERSION, ESV_VERSION, MBBTAG12_VERSION];

const bundledBooks = (bibleId: string): Book[] =>
  KJV_BOOKS.map((b) => ({
    id: b.id,
    bibleId,
    name: b.name,
    abbreviation: b.abbreviation,
    chapterCount: b.chapterCount,
  }));

export const fallbackListBooks = (bibleId: string): Book[] => {
  if (!isBundledBibleId(bibleId)) return [];
  return bundledBooks(bibleId);
};

const neighborChapterId = (
  bibleId: string,
  bookId: string,
  chapter: number,
  offset: number,
): string | undefined => {
  const bookIndex = KJV_BOOKS.findIndex((b) => b.id === bookId);
  if (bookIndex < 0) return undefined;
  const book = KJV_BOOKS[bookIndex];
  const target = chapter + offset;
  if (target >= 1 && target <= book.chapterCount) {
    return chapterIdOf(bibleId, book.id, target);
  }
  if (offset < 0 && bookIndex > 0) {
    const prev = KJV_BOOKS[bookIndex - 1];
    return chapterIdOf(bibleId, prev.id, prev.chapterCount);
  }
  if (offset > 0 && bookIndex < KJV_BOOKS.length - 1) {
    const next = KJV_BOOKS[bookIndex + 1];
    return chapterIdOf(bibleId, next.id, 1);
  }
  return undefined;
};

const loadBundledBook = async (bibleId: string, bookId: string): Promise<RawKjvBook | null> => {
  if (bibleId === KJV_BIBLE_ID) return loadKjvBook(bookId);
  if (bibleId === ESV_BIBLE_ID) return loadEsvBook(bookId);
  if (bibleId === MBBTAG12_BIBLE_ID) return loadMbbtag12Book(bookId);
  return null;
};

export const fallbackGetChapter = async (chapterId: string): Promise<Chapter | null> => {
  const parsed = parseChapterId(chapterId);
  if (!parsed) return null;
  if (!isBundledBibleId(parsed.bibleId)) return null;
  if (!KJV_BOOK_BY_ID[parsed.bookId]) return null;

  const raw = await loadBundledBook(parsed.bibleId, parsed.bookId);
  if (!raw) return null;
  const copyright = COPYRIGHT_BY_BIBLE_ID[parsed.bibleId] ?? '';
  const chapter = normalizeBundledChapter(raw, parsed.bibleId, parsed.bookId, parsed.chapter, copyright);
  if (!chapter) return null;

  const chNum = Number(parsed.chapter);
  return {
    ...chapter,
    prevId: neighborChapterId(parsed.bibleId, parsed.bookId, chNum, -1),
    nextId: neighborChapterId(parsed.bibleId, parsed.bookId, chNum, +1),
  };
};
