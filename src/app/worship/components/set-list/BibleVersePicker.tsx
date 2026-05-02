'use client';

import { useState, useMemo } from 'react';
import { useBibleVersions } from '@/hooks/useBibleVersions';
import { useBibleBooks } from '@/hooks/useBibleBooks';
import { useBibleChapter } from '@/hooks/useBibleChapter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { SongResult } from '@/types/worship.types';
import type { Verse } from '@/types/bible';

interface BibleVersePickerProps {
  onAdd: (song: SongResult) => void;
  onBack: () => void;
}

function buildVerseRef(chapterNum: string, verses: Verse[]): string {
  if (verses.length === 0) return '';
  const sorted = [...verses].sort((a, b) => a.number - b.number);
  const nums = sorted.map((v) => v.number);

  const ranges: string[] = [];
  let start = nums[0];
  let prev = nums[0];

  for (let i = 1; i <= nums.length; i++) {
    if (i < nums.length && nums[i] === prev + 1) {
      prev = nums[i];
    } else {
      ranges.push(start === prev ? String(start) : `${start}-${prev}`);
      if (i < nums.length) {
        start = nums[i];
        prev = nums[i];
      }
    }
  }

  return `${chapterNum}:${ranges.join(', ')}`;
}

export function BibleVersePicker({ onAdd, onBack }: BibleVersePickerProps) {
  const [versionId, setVersionId] = useState('');
  const [bookId, setBookId] = useState('');
  const [chapterNum, setChapterNum] = useState('');
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [role, setRole] = useState('Scripture Reading');

  const { data: versions, isLoading: versionsLoading } = useBibleVersions();
  const { data: books, isLoading: booksLoading } = useBibleBooks(versionId || undefined);

  const selectedBook = books?.find((b) => b.id === bookId);
  const chapterCount = selectedBook?.chapterCount ?? 0;
  const chapterId = versionId && bookId && chapterNum
    ? `${versionId}.${bookId}.${chapterNum}`
    : undefined;

  const { data: chapter, isLoading: chapterLoading } = useBibleChapter(chapterId);

  const allVerses = useMemo(
    () => chapter?.sections.flatMap((s) => s.verses) ?? [],
    [chapter],
  );

  const selectedVerses = useMemo(
    () => allVerses.filter((v) => selectedVerseIds.includes(v.id)),
    [allVerses, selectedVerseIds],
  );

  const versionAbbr = versions?.find((v) => v.id === versionId)?.abbreviation ?? versionId;
  const refLabel = selectedVerses.length > 0 && chapter
    ? `${chapter.bookName} ${buildVerseRef(chapter.number, selectedVerses)} ${versionAbbr}`
    : '';

  function toggleVerse(verse: Verse) {
    setSelectedVerseIds((prev) =>
      prev.includes(verse.id) ? prev.filter((id) => id !== verse.id) : [...prev, verse.id],
    );
  }

  function handleVersionChange(val: string) {
    setVersionId(val);
    setBookId('');
    setChapterNum('');
    setSelectedVerseIds([]);
  }

  function handleBookChange(val: string) {
    setBookId(val);
    setChapterNum('');
    setSelectedVerseIds([]);
  }

  function handleChapterChange(val: string) {
    setChapterNum(val);
    setSelectedVerseIds([]);
  }

  function handleAdd() {
    if (!selectedVerses.length || !chapter) return;
    const sorted = [...selectedVerses].sort((a, b) => a.number - b.number);
    const verseText = sorted.map((v) => v.text).join(' ');
    const ref = `${chapter.bookName} ${buildVerseRef(chapter.number, selectedVerses)} (${versionAbbr})`;
    const lyrics = `${verseText} — ${ref}`;
    onAdd({
      title: refLabel,
      artist: versionAbbr,
      role: role.trim() || 'Scripture Reading',
      lyrics,
      isBibleVerse: true,
    });
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* Version */}
      <Select value={versionId} onValueChange={handleVersionChange}>
        <SelectTrigger className='h-8 text-xs'>
          <SelectValue placeholder={versionsLoading ? 'Loading…' : 'Version'} />
        </SelectTrigger>
        <SelectContent>
          {versions?.map((v) => (
            <SelectItem key={v.id} value={v.id} className='text-xs'>
              {v.abbreviation} — {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Book */}
      <Select value={bookId} onValueChange={handleBookChange} disabled={!versionId}>
        <SelectTrigger className='h-8 text-xs'>
          <SelectValue placeholder={booksLoading ? 'Loading…' : 'Book'} />
        </SelectTrigger>
        <SelectContent>
          {books?.map((b) => (
            <SelectItem key={b.id} value={b.id} className='text-xs'>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Chapter */}
      <Select value={chapterNum} onValueChange={handleChapterChange} disabled={!bookId}>
        <SelectTrigger className='h-8 text-xs'>
          <SelectValue placeholder='Chapter' />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: chapterCount }, (_, i) => (
            <SelectItem key={i + 1} value={String(i + 1)} className='text-xs'>
              Chapter {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Verse list */}
      {chapterId && (
        <div className='rounded-md border border-border overflow-y-auto max-h-[180px]'>
          {chapterLoading ? (
            <p className='px-3 py-2 text-xs text-muted-foreground'>Loading verses…</p>
          ) : (
            allVerses.map((verse) => {
              const selected = selectedVerseIds.includes(verse.id);
              return (
                <button
                  key={verse.id}
                  onClick={() => toggleVerse(verse)}
                  className={`w-full text-left flex gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent/60 ${
                    selected ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className='font-mono text-muted-foreground shrink-0 w-5'>{verse.number}</span>
                  <span className='leading-relaxed'>{verse.text}</span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Reference label */}
      {refLabel && (
        <p className='text-[11px] font-medium text-primary truncate'>{refLabel}</p>
      )}

      {/* Role input */}
      <Input
        placeholder='Role (e.g. Scripture Reading)'
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className='h-8 text-xs'
      />

      {/* Actions */}
      <div className='flex items-center justify-end gap-2'>
        <button
          onClick={onBack}
          className='rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors'
        >
          Back
        </button>
        <button
          onClick={handleAdd}
          disabled={selectedVerses.length === 0}
          className='rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Add to set
        </button>
      </div>
    </div>
  );
}
