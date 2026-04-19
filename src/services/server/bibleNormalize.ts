import type { Chapter, Section, Verse } from '@/types/bible';
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

export const normalizeKjvChapter = (
  raw: RawKjvBook,
  bookId: string,
  chapterNumber: string,
): Chapter | null => {
  const meta = KJV_BOOK_BY_ID[bookId];
  if (!meta) return null;
  const rawChapter = raw.chapters.find((c) => c.chapter === chapterNumber);
  if (!rawChapter) return null;

  const verses: Verse[] = rawChapter.verses.map((v) => ({
    id: fullVerseId(KJV_BIBLE_ID, bookId, chapterNumber, v.verse),
    number: Number(v.verse),
    text: v.text,
  }));

  return {
    id: chapterIdOf(KJV_BIBLE_ID, bookId, chapterNumber),
    bibleId: KJV_BIBLE_ID,
    bookId,
    bookName: meta.name,
    number: chapterNumber,
    reference: `${meta.name} ${chapterNumber}`,
    copyright: 'King James Version — Public Domain',
    sections: [{ verses }],
  };
};

// --- API.Bible normalization -----------------------------------------------

interface ApiBibleChapterResponse {
  data: {
    id: string;
    bibleId: string;
    bookId: string;
    number: string;
    reference: string;
    copyright?: string;
    next?: { id: string } | null;
    previous?: { id: string } | null;
    content: ApiBibleNode[] | string;
  };
}

interface ApiBibleNode {
  type?: string;
  name?: string;
  attrs?: Record<string, string>;
  items?: ApiBibleNode[];
  text?: string;
}

const collectText = (nodes: ApiBibleNode[] | undefined): string => {
  if (!nodes) return '';
  let out = '';
  for (const n of nodes) {
    if (typeof n.text === 'string') out += n.text;
    if (n.items) out += collectText(n.items);
  }
  return out.replace(/\s+/g, ' ').trim();
};

const isHeadingPara = (node: ApiBibleNode): boolean => {
  const style = node.attrs?.style ?? '';
  return node.name === 'para' && /^s\d*$/.test(style);
};

const isVerseStart = (node: ApiBibleNode): node is ApiBibleNode & { attrs: { number: string; sid: string } } =>
  node.name === 'verse' && node.attrs?.style === 'v' && !!node.attrs?.number;

export const normalizeApiBibleChapter = (
  resp: ApiBibleChapterResponse,
  bookName: string,
): Chapter => {
  const { data } = resp;
  const sections: Section[] = [];
  let currentSection: Section = { verses: [] };
  let currentVerseNum: number | null = null;
  let currentVerseText = '';
  let currentVerseId = '';

  const flushVerse = () => {
    if (currentVerseNum !== null) {
      currentSection.verses.push({
        id: currentVerseId,
        number: currentVerseNum,
        text: currentVerseText.replace(/\s+/g, ' ').trim(),
      });
    }
    currentVerseNum = null;
    currentVerseText = '';
    currentVerseId = '';
  };

  const walk = (nodes: ApiBibleNode[]): void => {
    for (const n of nodes) {
      if (isHeadingPara(n)) {
        flushVerse();
        if (currentSection.verses.length > 0) sections.push(currentSection);
        currentSection = { heading: collectText(n.items), verses: [] };
        continue;
      }
      if (isVerseStart(n)) {
        flushVerse();
        currentVerseNum = Number(n.attrs.number);
        currentVerseId = `${data.bibleId}.${data.bookId}.${data.number}.${n.attrs.number}`;
        continue;
      }
      if (typeof n.text === 'string' && currentVerseNum !== null) {
        currentVerseText += n.text;
        continue;
      }
      if (n.items) walk(n.items);
    }
  };

  if (Array.isArray(data.content)) walk(data.content);

  flushVerse();
  if (currentSection.verses.length > 0) sections.push(currentSection);

  return {
    id: data.id,
    bibleId: data.bibleId,
    bookId: data.bookId,
    bookName,
    number: data.number,
    reference: data.reference,
    copyright: data.copyright,
    sections,
    prevId: data.previous?.id,
    nextId: data.next?.id,
  };
};
