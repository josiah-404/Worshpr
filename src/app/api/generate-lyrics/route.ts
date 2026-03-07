import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const searchLyricsSchema = z.object({
  description: z.string().min(1).max(500),
});

const songResultSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string().optional().default(''),
  year: z.string().optional().default(''),
  excerpt: z.string().optional().default(''),
  lyricsSource: z.string().optional().default(''),
});

const responseSchema = z.object({
  results: z.array(songResultSchema),
  totalFound: z.number(),
  suggestion: z.string().optional(),
});

/** Extract the first {...} JSON object from a string that may contain surrounding text. */
function extractJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = searchLyricsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { description } = parsed.data;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a worship song search assistant. The user is looking for existing worship or praise songs.

User query: "${description}"

Search your knowledge for real worship/praise songs that match this query. The query may be:
- A song title (exact or partial), e.g. "Pusong Dalisay", "Amazing Grace"
- A partial lyric
- A theme, e.g. "songs about healing", "grace"
- A scripture reference, e.g. "Psalm 23"
- A language/version, e.g. "Tagalog worship songs about prayer"

Return up to 5 matching songs ranked by relevance.

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation, no extra text before or after. The JSON must match this exact shape:
{
  "results": [
    {
      "title": "Exact Song Title",
      "artist": "Artist or Band Name",
      "album": "Album name or empty string",
      "year": "Release year or empty string",
      "excerpt": "A short representative excerpt (chorus or hook, max 4 lines). Include the section label on the first line, e.g. [Chorus]",
      "lyricsSource": ""
    }
  ],
  "totalFound": 1
}

If nothing matches, return:
{"results":[],"totalFound":0,"suggestion":"Helpful message here"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const raw = response.text?.trim() ?? '';

    if (!raw) {
      return NextResponse.json(
        { error: 'No response from AI. Please try again.' },
        { status: 502 },
      );
    }

    // Extract JSON from anywhere in the response (handles stray text / grounding metadata)
    const jsonStr = extractJson(raw) ?? raw;

    let result: z.infer<typeof responseSchema>;
    try {
      const parsed = responseSchema.safeParse(JSON.parse(jsonStr));
      if (!parsed.success) {
        // Shape mismatch — try to return whatever we got as-is
        result = { results: [], totalFound: 0, suggestion: 'Unexpected response format. Please try again.' };
      } else {
        result = parsed.data;
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    let message = 'Unexpected error';
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as {
          error?: { message?: string };
        };
        message = parsed.error?.message ?? error.message;
      } catch {
        message = error.message;
      }
    }

    const isQuotaError =
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('resource_exhausted');

    return NextResponse.json(
      {
        error: isQuotaError
          ? 'Gemini API quota exceeded. Please try again later or check your billing plan.'
          : message,
      },
      { status: 500 },
    );
  }
}
