import { NextRequest, NextResponse } from 'next/server';
import { chapterIdSchema } from '@/validations/bible';
import { serverEnv } from '@/lib/env';
import { fallbackGetChapter, isBundledBibleId } from '@/services/server/bibleFallback.server';
import { yvGetChapter, isYvId } from '@/services/server/youVersionApi.server';
import { parseChapterId } from '@/services/server/bibleNormalize';
import { KJV_BOOK_BY_ID } from '@/data/kjv';

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
    if (isBundledBibleId(parts.bibleId)) {
      const chapter = await fallbackGetChapter(chapterId);
      if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      return NextResponse.json({ data: chapter }, { status: 200 });
    }

    if (isYvId(parts.bibleId)) {
      if (!serverEnv.YOUVERSION_API_KEY) {
        return NextResponse.json({ error: 'YouVersion API not configured' }, { status: 503 });
      }
      const chapter = await yvGetChapter(chapterId, bookName);
      return NextResponse.json({ data: chapter }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown Bible version' }, { status: 400 });
  } catch (err) {
    console.error('[bible/chapters] error:', err);
    return NextResponse.json({ error: 'Failed to load chapter' }, { status: 500 });
  }
}
