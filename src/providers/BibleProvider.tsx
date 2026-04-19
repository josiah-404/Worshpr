'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import type { BibleFontSize } from '@/types/bible';

type PickerKind = 'book' | 'version' | null;

interface BibleLocation {
  bookId: string;
  chapter: string;
}

interface BibleContextValue {
  hydrated: boolean;

  versionId: string;
  setVersionId: (id: string) => void;

  bookId: string;
  chapterNumber: string;
  setLocation: (bookId: string, chapter: string) => void;

  selectedVerseIds: string[];
  toggleVerse: (id: string) => void;
  clearSelection: () => void;

  pickerOpen: PickerKind;
  setPickerOpen: (p: PickerKind) => void;

  fontSize: BibleFontSize;
  setFontSize: (s: BibleFontSize) => void;
}

const BibleContext = createContext<BibleContextValue | null>(null);

const LS_VERSION = 'bible:version';
const LS_LOCATION = 'bible:location';
const LS_FONTSIZE = 'bible:fontSize';

const DEFAULT_VERSION = 'KJV';
const DEFAULT_LOCATION: BibleLocation = { bookId: 'GEN', chapter: '1' };
const DEFAULT_FONTSIZE: BibleFontSize = 'md';

const readLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

interface BibleProviderProps {
  children: ReactNode;
}

export const BibleProvider: FC<BibleProviderProps> = ({ children }) => {
  const [hydrated, setHydrated] = useState(false);
  const [versionId, setVersionIdState] = useState<string>(DEFAULT_VERSION);
  const [location, setLocationState] = useState<BibleLocation>(DEFAULT_LOCATION);
  const [fontSize, setFontSizeState] = useState<BibleFontSize>(DEFAULT_FONTSIZE);
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState<PickerKind>(null);

  useEffect(() => {
    setVersionIdState(readLocal<string>(LS_VERSION, DEFAULT_VERSION));
    setLocationState(readLocal<BibleLocation>(LS_LOCATION, DEFAULT_LOCATION));
    setFontSizeState(readLocal<BibleFontSize>(LS_FONTSIZE, DEFAULT_FONTSIZE));
    setHydrated(true);
  }, []);

  const setVersionId = useCallback((id: string) => {
    setVersionIdState(id);
    writeLocal(LS_VERSION, id);
    setSelectedVerseIds([]);
  }, []);

  const setLocation = useCallback((bookId: string, chapter: string) => {
    const next = { bookId, chapter };
    setLocationState(next);
    writeLocal(LS_LOCATION, next);
    setSelectedVerseIds([]);
  }, []);

  const setFontSize = useCallback((s: BibleFontSize) => {
    setFontSizeState(s);
    writeLocal(LS_FONTSIZE, s);
  }, []);

  const toggleVerse = useCallback((id: string) => {
    setSelectedVerseIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedVerseIds([]), []);

  const value = useMemo<BibleContextValue>(
    () => ({
      hydrated,
      versionId,
      setVersionId,
      bookId: location.bookId,
      chapterNumber: location.chapter,
      setLocation,
      selectedVerseIds,
      toggleVerse,
      clearSelection,
      pickerOpen,
      setPickerOpen,
      fontSize,
      setFontSize,
    }),
    [
      hydrated,
      versionId,
      setVersionId,
      location,
      setLocation,
      selectedVerseIds,
      toggleVerse,
      clearSelection,
      pickerOpen,
      fontSize,
      setFontSize,
    ],
  );

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
};

export const useBible = (): BibleContextValue => {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error('useBible must be used inside <BibleProvider>');
  return ctx;
};
