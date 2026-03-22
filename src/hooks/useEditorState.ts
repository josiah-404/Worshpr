import { useState, useRef, useEffect, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { api } from '@/lib/axios';
import { useAiSearchQuota } from '@/hooks/useAiSearchQuota';
import {
  SongResult,
  buildSongBlock,
  buildDisplaySlides,
} from '@/types/worship.types';
import { parseLyrics } from '@/lib/lyricsParser';

export type LyricsMode = 'paste' | 'ai';
export type AddMode = 'choose' | 'manual' | 'ai' | 'section';

export interface EditorState {
  // Dialog / panel visibility
  bgDialogOpen: boolean;
  setBgDialogOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Lyrics mode (Paste tab vs AI Search tab)
  lyricsMode: LyricsMode;
  setLyricsMode: (mode: LyricsMode) => void;

  // AI search
  aiDescription: string;
  setAiDescription: (v: string) => void;
  aiLoading: boolean;
  aiError: string | null;
  setAiError: (e: string | null) => void;
  aiResults: SongResult[];
  expandedIdx: number | null;
  setExpandedIdx: (i: number | null) => void;
  fetchingIdx: number | null;
  aiRoleInputIdx: number | null;
  setAiRoleInputIdx: (i: number | null) => void;
  aiRoleInputValue: string;
  setAiRoleInputValue: (v: string) => void;
  cooldownSecsLeft: number;
  isCoolingDown: boolean;
  quotaLoading: boolean;
  quotaExhausted: boolean;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;

  // Set list
  songQueue: SongResult[];

  // Add-song dialog
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  addMode: AddMode;
  setAddMode: (mode: AddMode) => void;
  sectionLabel: string;
  setSectionLabel: (v: string) => void;
  manualTitle: string;
  setManualTitle: (v: string) => void;
  manualArtist: string;
  setManualArtist: (v: string) => void;
  manualRole: string;
  setManualRole: (v: string) => void;
  manualLyricsText: string;
  setManualLyricsText: (v: string) => void;

  // Inline edit
  editingIdx: number | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editArtist: string;
  setEditArtist: (v: string) => void;
  editRole: string;
  setEditRole: (v: string) => void;

  // Handlers
  handleSearchLyrics: () => Promise<void>;
  handleSelectSong: (song: SongResult) => void;
  handleRemoveFromQueue: (song: SongResult) => void;
  handleFetchLyrics: (idx: number) => Promise<void>;
  handleRemoveSong: (idx: number) => void;
  handleStartEdit: (idx: number) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleAddManualSong: () => void;
  handleAddSection: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

interface UseEditorStateOptions {
  lyrics: string;
  setLyrics: (v: string) => void;
  setSlides: (slides: string[]) => void;
  /** Pre-loaded queue from the database — used to restore the set list on page load. */
  initialQueue?: SongResult[];
}

export function useEditorState({
  lyrics,
  setLyrics,
  setSlides,
  initialQueue,
}: UseEditorStateOptions): EditorState {
  // ── Dialog / panel ──────────────────────────────────────────────────────────
  const [bgDialogOpen, setBgDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Lyrics mode ─────────────────────────────────────────────────────────────
  const [lyricsMode, setLyricsMode] = useState<LyricsMode>('paste');

  // ── AI search ───────────────────────────────────────────────────────────────
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<SongResult[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fetchingIdx, setFetchingIdx] = useState<number | null>(null);
  const [aiRoleInputIdx, setAiRoleInputIdx] = useState<number | null>(null);
  const [aiRoleInputValue, setAiRoleInputValue] = useState('');

  const {
    quota,
    isLoading: quotaLoading,
    quotaExhausted,
    consume: consumeQuota,
    cooldownMs,
  } = useAiSearchQuota();
  const quotaUsed = quota?.used ?? 0;
  const quotaRemaining = quota?.remaining ?? 0;
  const quotaLimit = quota?.limit ?? 20;

  const [cooldownSecsLeft, setCooldownSecsLeft] = useState(0);
  const isCoolingDown = cooldownSecsLeft > 0;
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Set list ────────────────────────────────────────────────────────────────
  const [songQueue, setSongQueue] = useState<SongResult[]>(initialQueue ?? []);

  // Snapshot of free-form textarea before the first queued song takes over
  const prequeueLyricsRef = useRef<string | null>(null);

  // Seed the queue once when initialQueue arrives (e.g. after page load)
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!initialQueue || initialQueue.length === 0) return;
    seededRef.current = true;
    setSongQueue(initialQueue);
  }, [initialQueue]);

  // ── Add-song dialog ─────────────────────────────────────────────────────────
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('choose');
  const [sectionLabel, setSectionLabel] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [manualLyricsText, setManualLyricsText] = useState('');

  // ── Inline edit ─────────────────────────────────────────────────────────────
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editRole, setEditRole] = useState('');

  // ── Rebuild slides whenever lyrics or queue change ───────────────────────────
  useEffect(() => {
    setSlides(buildDisplaySlides(lyrics, songQueue));
  }, [lyrics, songQueue, setSlides]);

  // ── Cleanup cooldown timer on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const startCooldown = useCallback(() => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    const secs = Math.ceil(cooldownMs / 1000);
    setCooldownSecsLeft(secs);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cooldownMs]);

  const handleSearchLyrics = useCallback(async () => {
    if (!aiDescription.trim() || quotaExhausted || isCoolingDown) return;
    setAiLoading(true);
    setAiError(null);
    setAiResults([]);
    setExpandedIdx(null);
    try {
      const { data: res } = await api.post<{
        data: { results: SongResult[]; totalFound: number; suggestion?: string };
      }>('/generate-lyrics', { description: aiDescription });
      setAiResults(res.data.results ?? []);
      await consumeQuota(1);
      startCooldown();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setAiLoading(false);
    }
  }, [aiDescription, quotaExhausted, isCoolingDown, consumeQuota, startCooldown]);

  const handleSelectSong = useCallback(
    (song: SongResult) => {
      setSongQueue((prev) => {
        const alreadyQueued = prev.some(
          (s) => s.title === song.title && s.artist === song.artist,
        );
        if (alreadyQueued) return prev;
        if (prev.length === 0) prequeueLyricsRef.current = lyrics;
        const next = [...prev, song];
        setLyrics(parseLyrics(next.map(buildSongBlock).join('\n\n\n')));
        return next;
      });
      setLyricsMode('paste');
    },
    [lyrics, setLyrics],
  );

  const handleRemoveFromQueue = useCallback(
    (song: SongResult) => {
      setSongQueue((prev) => {
        const next = prev.filter(
          (s) => !(s.title === song.title && s.artist === song.artist),
        );
        if (next.length === 0) {
          setLyrics(prequeueLyricsRef.current ?? '');
          prequeueLyricsRef.current = null;
        } else {
          setLyrics(parseLyrics(next.map(buildSongBlock).join('\n\n\n')));
        }
        return next;
      });
    },
    [setLyrics],
  );

  const handleFetchLyrics = useCallback(
    async (idx: number) => {
      const song = aiResults[idx];
      if (!song) return;
      setFetchingIdx(idx);
      setAiError(null);
      try {
        const { data: res } = await api.post<{ data: { lyrics: string } }>(
          '/fetch-lyrics',
          { title: song.title, artist: song.artist },
        );
        const updatedSong: SongResult = { ...song, lyrics: res.data.lyrics };
        setAiResults((prev) => prev.map((s, i) => (i === idx ? updatedSong : s)));
        setSongQueue((prev) => {
          const inQueue = prev.some(
            (s) => s.title === song.title && s.artist === song.artist,
          );
          if (!inQueue) return prev;
          const next = prev.map((s) =>
            s.title === song.title && s.artist === song.artist ? updatedSong : s,
          );
          setLyrics(parseLyrics(next.map(buildSongBlock).join('\n\n\n')));
          return next;
        });
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Failed to fetch lyrics.');
      } finally {
        setFetchingIdx(null);
      }
    },
    [aiResults, setLyrics],
  );

  const handleRemoveSong = useCallback(
    (idx: number) => {
      setSongQueue((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        if (next.length === 0) {
          setLyrics(prequeueLyricsRef.current ?? '');
          prequeueLyricsRef.current = null;
        } else {
          setLyrics(parseLyrics(next.map(buildSongBlock).join('\n\n\n')));
        }
        return next;
      });
    },
    [setLyrics],
  );

  const handleStartEdit = useCallback(
    (idx: number) => {
      const song = songQueue[idx];
      if (!song) return;
      setEditingIdx(idx);
      setEditTitle(song.title);
      setEditArtist(song.artist);
      setEditRole(song.role ?? '');
    },
    [songQueue],
  );

  const handleSaveEdit = useCallback(() => {
    if (editingIdx === null) return;
    const title = editTitle.trim();
    if (!title) return;
    setSongQueue((prev) => {
      const next = prev.map((s, i) => {
        if (i !== editingIdx) return s;
        if (s.isSection) return { ...s, title };
        return {
          ...s,
          title,
          artist: editArtist.trim() || 'Unknown',
          role: editRole.trim() || undefined,
        };
      });
      setLyrics(parseLyrics(next.map(buildSongBlock).join('\n\n\n')));
      return next;
    });
    setEditingIdx(null);
  }, [editingIdx, editTitle, editArtist, editRole, setLyrics]);

  const handleCancelEdit = useCallback(() => setEditingIdx(null), []);

  const handleAddManualSong = useCallback(() => {
    const title = manualTitle.trim();
    if (!title) return;
    const song: SongResult = {
      title,
      artist: manualArtist.trim() || '',
      role: manualRole.trim() || undefined,
      lyrics: manualLyricsText.trim(),
    };
    handleSelectSong(song);
    setManualTitle('');
    setManualArtist('');
    setManualRole('');
    setManualLyricsText('');
    setAddDialogOpen(false);
    setAddMode('choose');
  }, [manualTitle, manualArtist, manualRole, manualLyricsText, handleSelectSong]);

  const handleAddSection = useCallback(() => {
    const label = sectionLabel.trim();
    if (!label) return;
    handleSelectSong({ title: label, artist: '', isSection: true });
    setSectionLabel('');
    setAddDialogOpen(false);
    setAddMode('choose');
  }, [sectionLabel, handleSelectSong]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSongQueue((prev) => {
        const oldIdx = prev.findIndex((_, i) => String(i) === active.id);
        const newIdx = prev.findIndex((_, i) => String(i) === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;

        const next = arrayMove(prev, oldIdx, newIdx);

        // Rebuild lyrics: only non-section songs WITH stored lyrics have body slots.
        // This mirrors buildDisplaySlides so body slots stay aligned.
        const oldBodies = lyrics.split(/\n{3,}/);
        let oldBodyIdx = 0;
        const bodiesByOldIdx: Record<number, string> = {};
        for (let i = 0; i < prev.length; i++) {
          if (!prev[i].isSection && !!prev[i].lyrics?.trim()) {
            bodiesByOldIdx[i] = oldBodies[oldBodyIdx] ?? '';
            oldBodyIdx++;
          }
        }

        let newBodyIdx = 0;
        const newBodies: string[] = [];
        for (let i = 0; i < next.length; i++) {
          if (!next[i].isSection && !!next[i].lyrics?.trim()) {
            // Find where this song was in prev
            const prevIdx = prev.findIndex(
              (s) => s.title === next[i].title && s.artist === next[i].artist,
            );
            newBodies[newBodyIdx] = bodiesByOldIdx[prevIdx] ?? '';
            newBodyIdx++;
          }
        }

        setLyrics(parseLyrics(newBodies.join('\n\n\n')));
        return next;
      });
    },
    [lyrics, setLyrics],
  );

  return {
    bgDialogOpen,
    setBgDialogOpen,
    settingsOpen,
    setSettingsOpen,
    lyricsMode,
    setLyricsMode,
    aiDescription,
    setAiDescription,
    aiLoading,
    aiError,
    setAiError,
    aiResults,
    expandedIdx,
    setExpandedIdx,
    fetchingIdx,
    aiRoleInputIdx,
    setAiRoleInputIdx,
    aiRoleInputValue,
    setAiRoleInputValue,
    cooldownSecsLeft,
    isCoolingDown,
    quotaLoading,
    quotaExhausted,
    quotaUsed,
    quotaRemaining,
    quotaLimit,
    songQueue,
    addDialogOpen,
    setAddDialogOpen,
    addMode,
    setAddMode,
    sectionLabel,
    setSectionLabel,
    manualTitle,
    setManualTitle,
    manualArtist,
    setManualArtist,
    manualRole,
    setManualRole,
    manualLyricsText,
    setManualLyricsText,
    editingIdx,
    editTitle,
    setEditTitle,
    editArtist,
    setEditArtist,
    editRole,
    setEditRole,
    handleSearchLyrics,
    handleSelectSong,
    handleRemoveFromQueue,
    handleFetchLyrics,
    handleRemoveSong,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleAddManualSong,
    handleAddSection,
    handleDragEnd,
  };
}
