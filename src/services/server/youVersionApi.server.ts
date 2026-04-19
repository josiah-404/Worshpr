import type { BibleVersion, Book, Chapter, Verse } from '@/types/bible';
import { serverEnv } from '@/lib/env';
import { chapterIdOf, fullVerseId } from './bibleNormalize';

export const YV_PREFIX = 'YV-';
export const toYvBibleId = (numericId: number | string): string => `${YV_PREFIX}${numericId}`;
export const fromYvBibleId = (yvId: string): number => parseInt(yvId.slice(YV_PREFIX.length), 10);
export const isYvId = (bibleId: string): boolean => bibleId.startsWith(YV_PREFIX);

const BASE = 'https://api.youversion.com/v1';

// ---------------------------------------------------------------------------
// Raw YouVersion API types (verified against actual API responses)
// ---------------------------------------------------------------------------

interface YvBible {
  id: number;
  abbreviation: string;
  localized_abbreviation?: string;
  localized_title?: string;
  title?: string;
  language_tag: string;
  info?: string;
  copyright?: string;
}

interface YvBookChapter {
  id: string;         // e.g. "1"
  passage_id: string; // e.g. "GEN.1"
  title: string;
}

interface YvBook {
  id: string;
  title: string;
  full_title?: string;
  abbreviation?: string;
  canon?: string;
  chapters?: YvBookChapter[];
}

interface YvVerseMeta {
  id: string;         // verse number as string, e.g. "1"
  passage_id: string; // e.g. "GEN.1.1"
  title: string;
}

interface YvChapterNav {
  id: string;
  passage_id: string;
  title: string;
}

interface YvChapterMeta {
  id: string;
  passage_id: string; // e.g. "GEN.1"
  title: string;
  previous_chapter?: YvChapterNav | null;
  next_chapter?: YvChapterNav | null;
  verses: YvVerseMeta[];
}

interface YvPassage {
  id: string;
  content: string;  // HTML content with inline verse numbers
  reference: string;
}

// ---------------------------------------------------------------------------

const fetchYv = async <T>(path: string): Promise<T> => {
  const key = serverEnv.YOUVERSION_API_KEY;
  if (!key) throw new Error('YOUVERSION_API_KEY not configured');
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-YVP-App-Key': key },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouVersion ${res.status}: ${path} — ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
};

const languageName = (tag: string): string => {
  try {
    return new Intl.DisplayNames([tag, 'en'], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
};

// ---------------------------------------------------------------------------

export const yvListVersions = async (): Promise<BibleVersion[]> => {
  const json = await fetchYv<{ data: YvBible[] }>('/bibles?language_ranges[]=*');
  return json.data.map((v) => ({
    id: toYvBibleId(v.id),
    abbreviation: v.localized_abbreviation ?? v.abbreviation,
    name: v.localized_title ?? v.title ?? v.info ?? v.localized_abbreviation ?? v.abbreviation,
    language: {
      id: v.language_tag,
      name: languageName(v.language_tag),
      nameLocal: v.language_tag,
    },
  }));
};

export const yvListBooks = async (yvBibleId: string): Promise<Book[]> => {
  const numericId = fromYvBibleId(yvBibleId);
  const json = await fetchYv<{ data: YvBook[] }>(`/bibles/${numericId}/books`);
  return json.data.map((b) => ({
    id: b.id,
    bibleId: yvBibleId,
    name: b.title,
    nameLong: b.full_title,
    chapterCount: b.chapters
      ? b.chapters.filter((c) => /^\d+$/.test(c.id)).length
      : 0,
  }));
};

// Parse YouVersion HTML passage into individual verses.
// YouVersion marks verse boundaries with: <span class="yv-v" v="N"></span><span class="yv-verse-label">N</span>text
const parsePassageHtml = (
  html: string,
  verseMeta: YvVerseMeta[],
  yvBibleId: string,
  bookId: string,
  chapterNum: string,
): Verse[] => {
  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  const markerPattern = /<span[^>]+class="yv-v"[^>]+v="(\d+)"[^>]*><\/span>/gi;
  const markers: { num: number; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = markerPattern.exec(html)) !== null) {
    markers.push({ num: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length });
  }

  if (markers.length === 0) {
    return [{
      id: fullVerseId(yvBibleId, bookId, chapterNum, '1'),
      number: 1,
      text: stripTags(html),
    }];
  }

  return markers.map((marker, i) => {
    const textStart = marker.end;
    const textEnd = i + 1 < markers.length ? markers[i + 1].start : html.length;
    const meta = verseMeta.find((v) => parseInt(v.id, 10) === marker.num);
    const verseNum = meta ? meta.passage_id.split('.').pop() ?? String(marker.num) : String(marker.num);
    return {
      id: fullVerseId(yvBibleId, bookId, chapterNum, verseNum),
      number: marker.num,
      text: stripTags(html.slice(textStart, textEnd)),
    };
  });
};

// chapterId format: "YV-12.GEN.1"
export const yvGetChapter = async (
  chapterId: string,
  bookName: string,
): Promise<Chapter> => {
  const parts = chapterId.split('.');
  const chapterNum = parts.pop()!;
  const bookId = parts.pop()!;
  const yvBibleId = parts.join('.');
  const numericId = fromYvBibleId(yvBibleId);

  // Step 1: chapter metadata — returns object directly (no data wrapper)
  const meta = await fetchYv<YvChapterMeta>(
    `/bibles/${numericId}/books/${bookId}/chapters/${chapterNum}`,
  );

  // Step 2: passage text — also returns object directly
  const passage = await fetchYv<YvPassage>(
    `/bibles/${numericId}/passages/${encodeURIComponent(meta.passage_id)}?format=html`,
  );
  console.log('[YV passage content]:', passage.content?.slice(0, 1500));

  const navToChapterId = (nav: YvChapterNav | null | undefined): string | undefined => {
    if (!nav?.passage_id) return undefined;
    const [book, ch] = nav.passage_id.split('.');
    if (!book || !ch) return undefined;
    return chapterIdOf(yvBibleId, book, ch);
  };

  const verses = parsePassageHtml(
    passage.content,
    meta.verses,
    yvBibleId,
    bookId,
    chapterNum,
  );

  return {
    id: chapterId,
    bibleId: yvBibleId,
    bookId,
    bookName,
    number: chapterNum,
    reference: passage.reference ?? meta.title ?? `${bookName} ${chapterNum}`,
    sections: [{ verses }],
    prevId: navToChapterId(meta.previous_chapter),
    nextId: navToChapterId(meta.next_chapter),
  };
};
