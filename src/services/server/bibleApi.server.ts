import type { BibleVersion, Book, Chapter } from '@/types/bible';
import { serverEnv } from '@/lib/env';
import { normalizeApiBibleChapter } from './bibleNormalize';

const BASE = 'https://api.scripture.api.bible/v1';

interface ApiBibleVersionRaw {
  id: string;
  abbreviation: string;
  abbreviationLocal?: string;
  name: string;
  nameLocal?: string;
  description?: string;
  language: { id: string; name: string; nameLocal: string };
}

interface ApiBibleBookRaw {
  id: string;
  bibleId: string;
  name: string;
  nameLong?: string;
  abbreviation?: string;
  chapters?: { id: string; number: string }[];
}

const fetchApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const key = serverEnv.BIBLE_API_KEY;
  if (!key) throw new Error('BIBLE_API_KEY not configured');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'api-key': key, ...(init?.headers ?? {}) },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`API.Bible ${res.status}`);
  return (await res.json()) as T;
};

export const apiListVersions = async (): Promise<BibleVersion[]> => {
  const json = await fetchApi<{ data: ApiBibleVersionRaw[] }>('/bibles');
  return json.data.map((v) => ({
    id: v.id,
    abbreviation: v.abbreviationLocal ?? v.abbreviation,
    name: v.nameLocal ?? v.name,
    description: v.description,
    language: v.language,
  }));
};

export const apiListBooks = async (bibleId: string): Promise<Book[]> => {
  const json = await fetchApi<{ data: ApiBibleBookRaw[] }>(
    `/bibles/${encodeURIComponent(bibleId)}/books?include-chapters=true`,
  );
  return json.data.map((b) => ({
    id: b.id,
    bibleId: b.bibleId,
    name: b.name,
    nameLong: b.nameLong,
    abbreviation: b.abbreviation,
    // chapters array includes "intro"; exclude non-numeric.
    chapterCount: (b.chapters ?? []).filter((c) => /^\d+$/.test(c.number)).length,
  }));
};

export const apiGetChapter = async (
  chapterId: string,
  bookName: string,
): Promise<Chapter> => {
  const bibleId = chapterId.split('.')[0];
  const json = await fetchApi<Parameters<typeof normalizeApiBibleChapter>[0]>(
    `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(
      chapterId,
    )}?content-type=json&include-verse-numbers=true&include-titles=true&include-chapter-numbers=false&include-notes=false`,
  );
  return normalizeApiBibleChapter(json, bookName);
};
