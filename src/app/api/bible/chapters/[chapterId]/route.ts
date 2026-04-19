import { NextRequest, NextResponse } from 'next/server';
import { chapterIdSchema } from '@/validations/bible';
import { serverEnv } from '@/lib/env';
import { apiGetChapter } from '@/services/server/bibleApi.server';
import { fallbackGetChapter } from '@/services/server/bibleFallback.server';
import { parseChapterId } from '@/services/server/bibleNormalize';
import { KJV_BIBLE_ID, KJV_BOOK_BY_ID } from '@/data/kjv';

export const revalidate = 86400;

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } },
) {
  const chapterId = decodeURIComponent(params.chapterId);
  const parsed = chapterIdSchema.safeParse(chapterId);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chapterId' }, { status: 400 });
  }
  const parts = parseChapterId(chapterId);
  if (!parts) {
    return NextResponse.json({ error: 'Invalid chapterId' }, { status: 400 });
  }

  const bookName =
    KJV_BOOK_BY_ID[parts.bookId]?.name ??
    req.nextUrl.searchParams.get('bookName') ??
    parts.bookId;

  try {
    if (parts.bibleId === KJV_BIBLE_ID || !serverEnv.BIBLE_API_KEY) {
      const chapter = await fallbackGetChapter(chapterId);
      if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      return NextResponse.json({ data: chapter }, { status: 200 });
    }
    const chapter = await apiGetChapter(chapterId, bookName);
    return NextResponse.json({ data: chapter }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to load chapter' }, { status: 500 });
  }
}
