import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { fallbackListVersions } from '@/services/server/bibleFallback.server';
import { yvListVersions } from '@/services/server/youVersionApi.server';

export const revalidate = 86400;

export async function GET() {
  try {
    const fallback = fallbackListVersions();

    if (!serverEnv.YOUVERSION_API_KEY) {
      return NextResponse.json({ data: fallback }, { status: 200 });
    }

    try {
      const yvVersions = await yvListVersions();
      const existing = new Set(fallback.map((v) => v.abbreviation.toUpperCase()));
      const unique = yvVersions.filter((v) => !existing.has(v.abbreviation.toUpperCase()));
      return NextResponse.json({ data: [...fallback, ...unique] }, { status: 200 });
    } catch {
      return NextResponse.json({ data: fallback }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to load Bible versions' }, { status: 500 });
  }
}
