import { NextRequest, NextResponse } from 'next/server';
import { bibleIdSchema } from '@/validations/bible';
import { serverEnv } from '@/lib/env';
import { fallbackListBooks, isBundledBibleId } from '@/services/server/bibleFallback.server';
import { yvListBooks, isYvId } from '@/services/server/youVersionApi.server';

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const parsed = bibleIdSchema.safeParse(req.nextUrl.searchParams.get('bibleId'));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bibleId' }, { status: 400 });
  }
  const bibleId = parsed.data;

  try {
    if (isBundledBibleId(bibleId)) {
      return NextResponse.json({ data: fallbackListBooks(bibleId) }, { status: 200 });
    }

    if (isYvId(bibleId)) {
      if (!serverEnv.YOUVERSION_API_KEY) {
        return NextResponse.json({ error: 'YouVersion API not configured' }, { status: 503 });
      }
      const books = await yvListBooks(bibleId);
      return NextResponse.json({ data: books }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown Bible version' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to load books' }, { status: 500 });
  }
}
