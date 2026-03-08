'use client';

import { type FC } from 'react';
import { ClipboardPaste, Sparkles, Wand2, HelpCircle } from 'lucide-react';
import type { SongResult } from '@/types/worship.types';
import type { LyricsMode, AddMode } from '@/hooks/useEditorState';
import { SetList } from '@/app/worship/components/set-list/SetList';
import { AddSongDialog } from '@/app/worship/components/set-list/AddSongDialog';
import { AiSearchPanel } from './AiSearchPanel';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseLyrics, needsParsing } from '@/lib/lyricsParser';
import type { DragEndEvent } from '@dnd-kit/core';

interface LyricsPanelProps {
  lyricsMode: LyricsMode;
  setLyricsMode: (mode: LyricsMode) => void;
  lyrics: string;
  setLyrics: (v: string) => void;
  quotaExhausted: boolean;

  // Set list
  songQueue: SongResult[];
  editingIdx: number | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editArtist: string;
  setEditArtist: (v: string) => void;
  editRole: string;
  setEditRole: (v: string) => void;
  onStartEdit: (idx: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveSong: (idx: number) => void;
  onDragEnd: (event: DragEndEvent) => void;

  // Add dialog
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  addMode: AddMode;
  setAddMode: (mode: AddMode) => void;
  manualRole: string;
  setManualRole: (v: string) => void;
  manualTitle: string;
  setManualTitle: (v: string) => void;
  manualArtist: string;
  setManualArtist: (v: string) => void;
  manualLyricsText: string;
  setManualLyricsText: (v: string) => void;
  onAddManualSong: () => void;
  sectionLabel: string;
  setSectionLabel: (v: string) => void;
  onAddSection: () => void;

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
  quotaLoading: boolean;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
  isCoolingDown: boolean;
  cooldownSecsLeft: number;
  onSearch: () => void;
  onFetchLyrics: (idx: number) => void;
  onSelectSong: (song: SongResult) => void;
  onRemoveFromQueue: (song: SongResult) => void;
}

const FORMAT_GUIDE = `How slides are split from the textarea:

• One blank line (press Enter twice)
  → New slide

• Two blank lines (press Enter three times)
  → New song boundary (when using Set List)

The Format button fixes common issues:
  – Extra blank lines (3+) collapsed to 2
  – Trailing spaces removed from each line
  – Leading/trailing whitespace cleaned up

Tip: Use the Set List above to add songs
with a proper title slide instead of
pasting them all into this textarea.`;

export const LyricsPanel: FC<LyricsPanelProps> = (props) => {
  const {
    lyricsMode,
    setLyricsMode,
    lyrics,
    setLyrics,
    quotaExhausted,
    songQueue,
    addDialogOpen,
    setAddDialogOpen,
    addMode,
    setAddMode,
    setAiError,
  } = props;

  const hasFormattingIssues = needsParsing(lyrics);

  return (
    <TooltipProvider delayDuration={300}>
      <div className='w-96 shrink-0 flex flex-col gap-3'>
        {/* Header + mode toggle */}
        <div className='flex items-center justify-between shrink-0'>
          <div>
            <p className='text-sm font-medium'>Song Lyrics</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {lyricsMode === 'paste'
                ? 'Separate slides with a blank line'
                : 'Search for a song by title, lyric, theme, or scripture'}
            </p>
          </div>
          <div className='flex items-center gap-1 rounded-lg border border-border p-0.5'>
            <button
              onClick={() => {
                setLyricsMode('paste');
                setAiError(null);
              }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                lyricsMode === 'paste'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardPaste className='h-3.5 w-3.5' />
              Paste
            </button>
            <button
              onClick={() => {
                setLyricsMode('ai');
                setAiError(null);
              }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                lyricsMode === 'ai'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className='h-3.5 w-3.5' />
              AI Search
              {quotaExhausted && (
                <span className='ml-0.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0' />
              )}
            </button>
          </div>
        </div>

        {lyricsMode === 'paste' ? (
          <div className='flex flex-col gap-2 flex-1 min-h-0'>
            {/* Set list */}
            {songQueue.length > 0 && (
              <div className='flex flex-col gap-1 rounded-lg border border-border bg-accent/30 p-2 shrink-0'>
                <div className='flex items-center justify-between px-1'>
                  <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-widest'>
                    Set list
                  </p>
                  <button
                    onClick={() => {
                      setAddDialogOpen(true);
                      setAddMode('choose');
                    }}
                    className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
                  >
                    + Add song
                  </button>
                </div>
                <SetList
                  songQueue={songQueue}
                  editingIdx={props.editingIdx}
                  editTitle={props.editTitle}
                  setEditTitle={props.setEditTitle}
                  editArtist={props.editArtist}
                  setEditArtist={props.setEditArtist}
                  editRole={props.editRole}
                  setEditRole={props.setEditRole}
                  onStartEdit={props.onStartEdit}
                  onSaveEdit={props.onSaveEdit}
                  onCancelEdit={props.onCancelEdit}
                  onRemove={props.onRemoveSong}
                  onDragEnd={props.onDragEnd}
                />
              </div>
            )}

            {/* Add song dialog */}
            {addDialogOpen && (
              <AddSongDialog
                addMode={addMode}
                setAddMode={setAddMode}
                onClose={() => {
                  setAddDialogOpen(false);
                  setAddMode('choose');
                }}
                manualRole={props.manualRole}
                setManualRole={props.setManualRole}
                manualTitle={props.manualTitle}
                setManualTitle={props.setManualTitle}
                manualArtist={props.manualArtist}
                setManualArtist={props.setManualArtist}
                manualLyricsText={props.manualLyricsText}
                setManualLyricsText={props.setManualLyricsText}
                onAddManualSong={props.onAddManualSong}
                sectionLabel={props.sectionLabel}
                setSectionLabel={props.setSectionLabel}
                onAddSection={props.onAddSection}
                onSwitchToAi={() => {
                  setAddDialogOpen(false);
                  setAddMode('choose');
                  setLyricsMode('ai');
                  setAiError(null);
                }}
              />
            )}

            {/* Textarea toolbar */}
            <div className='flex items-center justify-between shrink-0'>
              <div className='flex items-center gap-1.5'>
                {/* Format button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setLyrics(parseLyrics(lyrics))}
                      disabled={!lyrics || !hasFormattingIssues}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        hasFormattingIssues
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25'
                          : 'border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                      }`}
                    >
                      <Wand2 className='h-3 w-3' />
                      Format
                      {hasFormattingIssues && (
                        <span className='h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0' />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom' className='max-w-[260px]'>
                    <p className='text-[11px] font-medium mb-1'>Auto-format lyrics</p>
                    <p className='text-[11px] text-muted-foreground'>
                      Normalizes spacing and line breaks so slides split correctly.
                      {hasFormattingIssues
                        ? ' Formatting issues detected — click to fix.'
                        : ' No issues found.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Guide tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className='flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors'>
                    <HelpCircle className='h-3.5 w-3.5' />
                    Guide
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side='left'
                  align='end'
                  className='max-w-[280px] p-3'
                >
                  <p className='text-[11px] font-medium mb-1.5'>Lyrics formatting guide</p>
                  <pre className='text-[10px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed'>
                    {FORMAT_GUIDE}
                  </pre>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Empty state or lyrics textarea */}
            {songQueue.length === 0 ? (
              <div className='flex-1 flex flex-col gap-2 min-h-0'>
                {!addDialogOpen && (
                  <button
                    onClick={() => {
                      setAddDialogOpen(true);
                      setAddMode('choose');
                    }}
                    className='w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/30 transition-colors shrink-0'
                  >
                    + Add song to set list
                  </button>
                )}
                <Textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder={
                    'Or paste raw lyrics here — slides split on blank lines\n(no title slide; use the set list above for formatted songs)'
                  }
                  className='flex-1 w-full font-mono leading-relaxed min-h-[160px] resize-none'
                />
              </div>
            ) : (
              <div className='flex-1 min-h-0 relative'>
                <Textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder='Lyrics auto-populated from set list…'
                  className='w-full h-full font-mono leading-relaxed min-h-[160px] resize-none'
                />
              </div>
            )}
          </div>
        ) : (
          <AiSearchPanel
            aiDescription={props.aiDescription}
            setAiDescription={props.setAiDescription}
            aiLoading={props.aiLoading}
            aiError={props.aiError}
            setAiError={props.setAiError}
            aiResults={props.aiResults}
            expandedIdx={props.expandedIdx}
            setExpandedIdx={props.setExpandedIdx}
            fetchingIdx={props.fetchingIdx}
            aiRoleInputIdx={props.aiRoleInputIdx}
            setAiRoleInputIdx={props.setAiRoleInputIdx}
            aiRoleInputValue={props.aiRoleInputValue}
            setAiRoleInputValue={props.setAiRoleInputValue}
            quotaLoading={props.quotaLoading}
            quotaExhausted={quotaExhausted}
            quotaUsed={props.quotaUsed}
            quotaRemaining={props.quotaRemaining}
            quotaLimit={props.quotaLimit}
            isCoolingDown={props.isCoolingDown}
            cooldownSecsLeft={props.cooldownSecsLeft}
            songQueue={songQueue}
            onSearch={props.onSearch}
            onFetchLyrics={props.onFetchLyrics}
            onSelectSong={props.onSelectSong}
            onRemoveFromQueue={props.onRemoveFromQueue}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
