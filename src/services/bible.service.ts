import { api } from '@/lib/axios';
import type { BibleVersion, Book, Chapter } from '@/types/bible';

export const getBibleVersions = async (): Promise<BibleVersion[]> => {
  const { data } = await api.get<{ data: BibleVersion[] }>('/bible/versions');
  return data.data;
};

export const getBibleBooks = async (bibleId: string): Promise<Book[]> => {
  const { data } = await api.get<{ data: Book[] }>('/bible/books', {
    params: { bibleId },
  });
  return data.data;
};

export const getBibleChapter = async (chapterId: string): Promise<Chapter> => {
  const { data } = await api.get<{ data: Chapter }>(
    `/bible/chapters/${encodeURIComponent(chapterId)}`,
  );
  return data.data;
};
