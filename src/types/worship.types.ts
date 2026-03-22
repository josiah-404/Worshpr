import { TITLE_SLIDE_MARKER } from '@/lib/constants';

export interface SongResult {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  /** Short AI-generated preview snippet shown in search results. */
  excerpt?: string;
  /**
   * Full fetched lyrics — populated after "Fetch lyrics" is called.
   * This is the only field used as the textarea body.
   */
  lyrics?: string;
  lyricsSource?: string;
  role?: string;
  /** True for single-slide section markers (Testimony, Word of God, etc.) */
  isSection?: boolean;
}

/**
 * Returns the lyrics body written into the textarea for this song.
 * Only `lyrics` (full, fetched) is used — never the short `excerpt`.
 * Sections have no body.
 */
export function buildSongBlock(song: SongResult): string {
  if (song.isSection) return '';
  return song.lyrics?.trim() ?? '';
}

/** Build the slides array that the presenter / preview / controller uses.
 *  Injects a §TITLE§ title slide before each song's lyric blocks using the
 *  queue metadata. Falls back to plain splitting when no queue is present. */
export function buildDisplaySlides(
  lyrics: string,
  queue: SongResult[],
): string[] {
  if (queue.length === 0) {
    return lyrics
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  const songBodies = lyrics.split(/\n{3,}/);
  const allSlides: string[] = [];
  let bodyIdx = 0;

  for (const song of queue) {
    if (song.isSection) {
      // Section: single announcement slide — role line holds the label
      allSlides.push(`${TITLE_SLIDE_MARKER}\n\n\n${song.title}`);
      continue;
    }

    allSlides.push(
      `${TITLE_SLIDE_MARKER}\n${song.title}\n${song.artist}\n${song.role ?? ''}`,
    );

    // Only consume a body slot when the song has stored lyrics.
    // Songs added without lyrics (title-only) don't occupy a slot so that
    // subsequent songs' lyrics stay correctly aligned.
    if (song.lyrics?.trim()) {
      const body = (songBodies[bodyIdx] ?? '').trim();
      bodyIdx++;

      if (body) {
        const lyricSlides = body
          .split(/\n{2,}/)
          .map((b) => b.trim())
          .filter(Boolean);
        allSlides.push(...lyricSlides);
      }
    }
  }

  return allSlides;
}
