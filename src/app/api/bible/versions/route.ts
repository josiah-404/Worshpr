import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { apiListVersions } from '@/services/server/bibleApi.server';
import { fallbackListVersions } from '@/services/server/bibleFallback.server';

export const revalidate = 86400;

export async function GET() {
  try {
    if (serverEnv.BIBLE_API_KEY) {
      try {
        const versions = await apiListVersions();
        const fallback = fallbackListVersions();
        const hasKjv = versions.some((v) => v.abbreviation.toUpperCase() === 'KJV');
        return NextResponse.json(
          { data: hasKjv ? versions : [...fallback, ...versions] },
          { status: 200 },
        );
      } catch {
        return NextResponse.json({ data: fallbackListVersions() }, { status: 200 });
      }
    }
    return NextResponse.json({ data: fallbackListVersions() }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to load Bible versions' }, { status: 500 });
  }
}
