import { NextRequest, NextResponse } from 'next/server';
import { bibleIdSchema } from '@/validations/bible';
import { serverEnv } from '@/lib/env';
import { apiListBooks } from '@/services/server/bibleApi.server';
import { fallbackListBooks } from '@/services/server/bibleFallback.server';
import { KJV_BIBLE_ID } from '@/data/kjv';

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const parsed = bibleIdSchema.safeParse(req.nextUrl.searchParams.get('bibleId'));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bibleId' }, { status: 400 });
  }
  const bibleId = parsed.data;

  try {
    if (bibleId === KJV_BIBLE_ID || !serverEnv.BIBLE_API_KEY) {
      return NextResponse.json({ data: fallbackListBooks(KJV_BIBLE_ID) }, { status: 200 });
    }
    const books = await apiListBooks(bibleId);
    return NextResponse.json({ data: books }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to load books' }, { status: 500 });
  }
}
