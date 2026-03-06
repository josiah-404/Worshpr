import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const searchLyricsSchema = z.object({
  description: z.string().min(1).max(500),
});

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

    // ─── Prompt ───────────────────────────────────────────────────────────────
    // NOTE: We removed the "return full lyrics" instruction because:
    //   1. LLMs hallucinate verbatim lyrics — they sound plausible but are wrong.
    //   2. Returning full lyrics may infringe copyright.
    //   3. Google Search grounding gives us real song metadata; lyrics should
    //      come from a licensed source (e.g. Genius API, CCLI, etc.)
    //
    // This prompt uses grounding to identify the correct song(s), then returns
    // a representative lyric excerpt (chorus / hook) only — enough for the user
    // to confirm the match, without fabricating or reproducing full copyrighted
    // lyrics verbatim.
    // ─────────────────────────────────────────────────────────────────────────
    const prompt = `You are a worship song search assistant with access to Google Search.
The user is searching for existing worship or praise songs.

User query: "${description}"

Steps:
1. Use Google Search to look up the exact song(s) matching the query. The query could be a song title, partial lyric, theme, scripture reference, or description.
2. Verify the song title, artist/band, and album using real search results — do NOT guess or rely on memory alone.
3. Return up to 5 matching songs, ranked by relevance.

Respond ONLY in the following JSON format — no markdown, no code fences, no extra text:
{
  "results": [
    {
      "title": "<Exact Song Title>",
      "artist": "<Artist or Band>",
      "album": "<Album name if known, or empty string>",
      "year": "<Release year if known, or empty string>",
      "excerpt": "<A short representative excerpt (chorus or hook, max 4 lines) using the REAL lyrics found via search — label the section, e.g. [Chorus]\\nLine 1\\nLine 2>",
      "lyricsSource": "<URL to a lyrics page found via search, e.g. genius.com or azlyrics.com, or empty string if not found>"
    }
  ],
  "totalFound": <number of results returned>
}

Rules:
- ONLY return real, verified songs found via Google Search. Do NOT fabricate songs or lyrics.
- If the query exactly matches a specific song title and artist, return that song first.
- If the query is a theme (e.g. "grace", "healing"), return the most well-known worship songs on that theme.
- If the query is a partial lyric, search for it and identify the correct song.
- If the query is a scripture reference (e.g. "Psalm 23"), return worship songs inspired by that passage.
- If nothing is found, return:
{
  "results": [],
  "totalFound": 0,
  "suggestion": "<A helpful message with alternatives or corrections>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
      config: {
        // Google Search grounding — this is what prevents hallucinated lyrics.
        // Gemini will search the web before answering, anchoring its response
        // in real search results rather than pattern-matched memory.
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = response.text?.trim() ?? '';

    let result: Record<string, unknown>;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
      result = JSON.parse(cleaned);
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
