import { KJV_BOOK_BY_ID, type RawKjvBook } from '@/data/kjv';

export const MBBTAG12_BIBLE_ID = 'MBBTAG12';

const cache = new Map<string, RawKjvBook>();

export const loadMbbtag12Book = async (bookId: string): Promise<RawKjvBook | null> => {
  if (cache.has(bookId)) return cache.get(bookId) ?? null;
  if (!KJV_BOOK_BY_ID[bookId]) return null;
  try {
    const mod = await import(`./${bookId}.json`);
    const book = (mod.default ?? mod) as RawKjvBook;
    cache.set(bookId, book);
    return book;
  } catch {
    return null;
  }
};
