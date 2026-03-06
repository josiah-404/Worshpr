import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const fetchLyricsSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
});

interface LrclibResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const LRCLIB_BASE = 'https://lrclib.net/api/search';
const HEADERS = {
  'User-Agent': 'Worshpr/1.0 (worship presentation app)',
  Accept: 'application/json',
};

async function lrclibSearch(params: Record<string, string>): Promise<LrclibResult[]> {
  const res = await fetch(`${LRCLIB_BASE}?${new URLSearchParams(params)}`, {
    headers: HEADERS,
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as LrclibResult[]) : [];
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff\s]/g, '').trim();
}

/** Score a result — higher is better. */
function score(result: LrclibResult, title: string, artist: string): number {
  if (!result.plainLyrics) return -1;
  const rTitle = normalize(result.trackName);
  const rArtist = normalize(result.artistName);
  const qTitle = normalize(title);
  const qArtist = normalize(artist);

  let s = 0;
  if (rTitle === qTitle) s += 100;
  else if (rTitle.includes(qTitle) || qTitle.includes(rTitle)) s += 50;

  if (rArtist === qArtist) s += 40;
  else if (rArtist.includes(qArtist) || qArtist.includes(rArtist)) s += 20;

  return s;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = fetchLyricsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, artist } = parsed.data;

    // Pass 1: exact artist + title
    let results = await lrclibSearch({ track_name: title, artist_name: artist });

    // Pass 2: title only (catches artist name mismatches / alternate credits)
    if (!results.some((r) => r.plainLyrics)) {
      results = await lrclibSearch({ track_name: title });
    }

    // Pass 3: free-text query combining both (catches transliteration / alternate spellings)
    if (!results.some((r) => r.plainLyrics)) {
      results = await lrclibSearch({ q: `${title} ${artist}` });
    }

    // Pass 4: title only as free-text query
    if (!results.some((r) => r.plainLyrics)) {
      results = await lrclibSearch({ q: title });
    }

    if (!results.length) {
      return NextResponse.json(
        {
          error: `No lyrics found for "${title}" by ${artist}. The song may not be in the lyrics database yet.`,
        },
        { status: 404 },
      );
    }

    // Pick the best-scoring result that has plain lyrics
    const best = results
      .filter((r) => r.plainLyrics)
      .sort((a, b) => score(b, title, artist) - score(a, title, artist))[0];

    if (!best?.plainLyrics) {
      return NextResponse.json(
        { error: 'Lyrics found but no plain text available for this track.' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { data: { lyrics: best.plainLyrics.trim(), source: 'lrclib.net' } },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
