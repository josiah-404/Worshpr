/**
 * Normalizes raw pasted lyrics so the editor splits them correctly.
 *
 * Rules applied (in order):
 * 1. Normalise Windows line-endings (\r\n → \n).
 * 2. Collapse runs of 3+ blank lines into exactly 2 (song-boundary separator).
 * 3. Ensure every run of exactly 1 blank line becomes exactly 1 blank line
 *    (single blank line = slide boundary — no change needed, but we tidy trailing spaces).
 * 4. Strip leading/trailing whitespace from each line (preserves blank lines).
 * 5. Remove leading and trailing blank lines from the whole text.
 *
 * Result: blocks of text separated by exactly one blank line become individual
 * slides. Blocks separated by two blank lines stay as two blank lines (used as
 * song-boundary separators when a set list is active).
 */
export function parseLyrics(raw: string): string {
  return raw
    // 1. Normalise CR LF
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 2. Trim trailing spaces on each line
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    // 3. Collapse 4+ consecutive newlines → exactly 3 (= two blank lines, the
    //    song-boundary separator). Three newlines (\n\n\n = two blank lines)
    //    is the correct separator and must not be collapsed.
    .replace(/\n{4,}/g, '\n\n\n')
    // 4. Strip leading/trailing blank lines from the whole block
    .trim();
}

/**
 * Returns true only when the text has issues that would cause slides to split
 * incorrectly — 3+ consecutive blank lines (collapses song boundaries) or
 * leading/trailing blank lines (adds phantom empty slides).
 * Trailing spaces and Windows line-endings are silently fixed by parseLyrics
 * but are not flagged here since they don't affect the slide output.
 */
export function needsParsing(text: string): boolean {
  if (!text) return false;
  // Flag only issues that break slide splitting:
  // - 4+ consecutive newlines (= 3+ blank lines, one too many)
  // - leading or trailing blank lines (phantom empty slides)
  return (
    /\n{4,}/.test(text) ||
    /^\n/.test(text) ||
    /\n$/.test(text)
  );
}
