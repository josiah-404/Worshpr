'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Highlight, HighlightColor } from '@/types/bible';

const KEY = 'bible:highlights:v1';

type HighlightMap = Record<string, Highlight>;

const canonicalKey = (fullVerseId: string): string => {
  // Strip version prefix: "KJV.EPH.1.3" -> "EPH.1.3"; "abc-123.EPH.1.3" -> "EPH.1.3"
  const parts = fullVerseId.split('.');
  if (parts.length < 3) return fullVerseId;
  return parts.slice(-3).join('.');
};

const read = (): HighlightMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HighlightMap) : {};
  } catch {
    return {};
  }
};

const write = (map: HighlightMap): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
};

export const useBibleHighlights = () => {
  const [map, setMap] = useState<HighlightMap>({});

  useEffect(() => {
    setMap(read());
  }, []);

  const setHighlight = useCallback((verseId: string, color: HighlightColor) => {
    setMap((prev) => {
      const key = canonicalKey(verseId);
      const next = { ...prev, [key]: { verseId: key, color, at: Date.now() } };
      write(next);
      return next;
    });
  }, []);

  const removeHighlight = useCallback((verseId: string) => {
    setMap((prev) => {
      const key = canonicalKey(verseId);
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      write(next);
      return next;
    });
  }, []);

  const getColor = useCallback(
    (verseId: string): HighlightColor | undefined => map[canonicalKey(verseId)]?.color,
    [map],
  );

  return { map, setHighlight, removeHighlight, getColor };
};
