'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Chapter, Verse } from '@/types/bible';

export interface CopyPayload {
  chapter: Chapter;
  versionAbbreviation: string;
  verses: Verse[];
}

const formatReference = (chapter: Chapter, verses: Verse[], abbr: string): string => {
  if (verses.length === 0) return '';
  const numbers = verses.map((v) => v.number).sort((a, b) => a - b);
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  const contiguous = numbers.every((n, i) => n === first + i);
  const range = contiguous && first !== last ? `${first}-${last}` : numbers.join(',');
  return `${chapter.bookName} ${chapter.number}:${range} (${abbr})`;
};

export const formatCopyText = ({ chapter, versionAbbreviation, verses }: CopyPayload): string => {
  const ordered = [...verses].sort((a, b) => a.number - b.number);
  const text = ordered.map((v) => v.text.trim()).join(' ');
  return `${text} — ${formatReference(chapter, ordered, versionAbbreviation)}`;
};

export const useCopyVerses = () =>
  useCallback(async (payload: CopyPayload) => {
    const text = formatCopyText(payload);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', { description: text.length > 120 ? undefined : text });
    } catch {
      toast.error('Copy failed', { description: 'Clipboard unavailable in this browser.' });
    }
  }, []);
