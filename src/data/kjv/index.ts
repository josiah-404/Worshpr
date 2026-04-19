import type { Book } from '@/types/bible';

interface KjvBookMeta {
  id: string;
  name: string;
  abbreviation: string;
  chapterCount: number;
}

export const KJV_BIBLE_ID = 'KJV';

export const KJV_BOOKS: readonly KjvBookMeta[] = [
  { id: 'GEN', name: 'Genesis', abbreviation: 'Gen', chapterCount: 50 },
  { id: 'EXO', name: 'Exodus', abbreviation: 'Exo', chapterCount: 40 },
  { id: 'LEV', name: 'Leviticus', abbreviation: 'Lev', chapterCount: 27 },
  { id: 'NUM', name: 'Numbers', abbreviation: 'Num', chapterCount: 36 },
  { id: 'DEU', name: 'Deuteronomy', abbreviation: 'Deu', chapterCount: 34 },
  { id: 'JOS', name: 'Joshua', abbreviation: 'Jos', chapterCount: 24 },
  { id: 'JDG', name: 'Judges', abbreviation: 'Jdg', chapterCount: 21 },
  { id: 'RUT', name: 'Ruth', abbreviation: 'Rut', chapterCount: 4 },
  { id: '1SA', name: '1 Samuel', abbreviation: '1Sa', chapterCount: 31 },
  { id: '2SA', name: '2 Samuel', abbreviation: '2Sa', chapterCount: 24 },
  { id: '1KI', name: '1 Kings', abbreviation: '1Ki', chapterCount: 22 },
  { id: '2KI', name: '2 Kings', abbreviation: '2Ki', chapterCount: 25 },
  { id: '1CH', name: '1 Chronicles', abbreviation: '1Ch', chapterCount: 29 },
  { id: '2CH', name: '2 Chronicles', abbreviation: '2Ch', chapterCount: 36 },
  { id: 'EZR', name: 'Ezra', abbreviation: 'Ezr', chapterCount: 10 },
  { id: 'NEH', name: 'Nehemiah', abbreviation: 'Neh', chapterCount: 13 },
  { id: 'EST', name: 'Esther', abbreviation: 'Est', chapterCount: 10 },
  { id: 'JOB', name: 'Job', abbreviation: 'Job', chapterCount: 42 },
  { id: 'PSA', name: 'Psalms', abbreviation: 'Psa', chapterCount: 150 },
  { id: 'PRO', name: 'Proverbs', abbreviation: 'Pro', chapterCount: 31 },
  { id: 'ECC', name: 'Ecclesiastes', abbreviation: 'Ecc', chapterCount: 12 },
  { id: 'SNG', name: 'Song of Solomon', abbreviation: 'Sng', chapterCount: 8 },
  { id: 'ISA', name: 'Isaiah', abbreviation: 'Isa', chapterCount: 66 },
  { id: 'JER', name: 'Jeremiah', abbreviation: 'Jer', chapterCount: 52 },
  { id: 'LAM', name: 'Lamentations', abbreviation: 'Lam', chapterCount: 5 },
  { id: 'EZK', name: 'Ezekiel', abbreviation: 'Ezk', chapterCount: 48 },
  { id: 'DAN', name: 'Daniel', abbreviation: 'Dan', chapterCount: 12 },
  { id: 'HOS', name: 'Hosea', abbreviation: 'Hos', chapterCount: 14 },
  { id: 'JOL', name: 'Joel', abbreviation: 'Jol', chapterCount: 3 },
  { id: 'AMO', name: 'Amos', abbreviation: 'Amo', chapterCount: 9 },
  { id: 'OBA', name: 'Obadiah', abbreviation: 'Oba', chapterCount: 1 },
  { id: 'JON', name: 'Jonah', abbreviation: 'Jon', chapterCount: 4 },
  { id: 'MIC', name: 'Micah', abbreviation: 'Mic', chapterCount: 7 },
  { id: 'NAM', name: 'Nahum', abbreviation: 'Nam', chapterCount: 3 },
  { id: 'HAB', name: 'Habakkuk', abbreviation: 'Hab', chapterCount: 3 },
  { id: 'ZEP', name: 'Zephaniah', abbreviation: 'Zep', chapterCount: 3 },
  { id: 'HAG', name: 'Haggai', abbreviation: 'Hag', chapterCount: 2 },
  { id: 'ZEC', name: 'Zechariah', abbreviation: 'Zec', chapterCount: 14 },
  { id: 'MAL', name: 'Malachi', abbreviation: 'Mal', chapterCount: 4 },
  { id: 'MAT', name: 'Matthew', abbreviation: 'Mat', chapterCount: 28 },
  { id: 'MRK', name: 'Mark', abbreviation: 'Mrk', chapterCount: 16 },
  { id: 'LUK', name: 'Luke', abbreviation: 'Luk', chapterCount: 24 },
  { id: 'JHN', name: 'John', abbreviation: 'Jhn', chapterCount: 21 },
  { id: 'ACT', name: 'Acts', abbreviation: 'Act', chapterCount: 28 },
  { id: 'ROM', name: 'Romans', abbreviation: 'Rom', chapterCount: 16 },
  { id: '1CO', name: '1 Corinthians', abbreviation: '1Co', chapterCount: 16 },
  { id: '2CO', name: '2 Corinthians', abbreviation: '2Co', chapterCount: 13 },
  { id: 'GAL', name: 'Galatians', abbreviation: 'Gal', chapterCount: 6 },
  { id: 'EPH', name: 'Ephesians', abbreviation: 'Eph', chapterCount: 6 },
  { id: 'PHP', name: 'Philippians', abbreviation: 'Php', chapterCount: 4 },
  { id: 'COL', name: 'Colossians', abbreviation: 'Col', chapterCount: 4 },
  { id: '1TH', name: '1 Thessalonians', abbreviation: '1Th', chapterCount: 5 },
  { id: '2TH', name: '2 Thessalonians', abbreviation: '2Th', chapterCount: 3 },
  { id: '1TI', name: '1 Timothy', abbreviation: '1Ti', chapterCount: 6 },
  { id: '2TI', name: '2 Timothy', abbreviation: '2Ti', chapterCount: 4 },
  { id: 'TIT', name: 'Titus', abbreviation: 'Tit', chapterCount: 3 },
  { id: 'PHM', name: 'Philemon', abbreviation: 'Phm', chapterCount: 1 },
  { id: 'HEB', name: 'Hebrews', abbreviation: 'Heb', chapterCount: 13 },
  { id: 'JAS', name: 'James', abbreviation: 'Jas', chapterCount: 5 },
  { id: '1PE', name: '1 Peter', abbreviation: '1Pe', chapterCount: 5 },
  { id: '2PE', name: '2 Peter', abbreviation: '2Pe', chapterCount: 3 },
  { id: '1JN', name: '1 John', abbreviation: '1Jn', chapterCount: 5 },
  { id: '2JN', name: '2 John', abbreviation: '2Jn', chapterCount: 1 },
  { id: '3JN', name: '3 John', abbreviation: '3Jn', chapterCount: 1 },
  { id: 'JUD', name: 'Jude', abbreviation: 'Jud', chapterCount: 1 },
  { id: 'REV', name: 'Revelation', abbreviation: 'Rev', chapterCount: 22 },
];

export const KJV_BOOK_BY_ID: Record<string, KjvBookMeta> = Object.fromEntries(
  KJV_BOOKS.map((b) => [b.id, b]),
);

export const getKjvBooks = (): Book[] =>
  KJV_BOOKS.map((b) => ({
    id: b.id,
    bibleId: KJV_BIBLE_ID,
    name: b.name,
    abbreviation: b.abbreviation,
    chapterCount: b.chapterCount,
  }));

interface RawKjvVerse {
  verse: string;
  text: string;
}
interface RawKjvChapter {
  chapter: string;
  verses: RawKjvVerse[];
}
export interface RawKjvBook {
  book: string;
  chapters: RawKjvChapter[];
}

const cache = new Map<string, RawKjvBook>();

export const loadKjvBook = async (bookId: string): Promise<RawKjvBook | null> => {
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
