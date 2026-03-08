'use client';

import { type FC } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import type { SongResult } from '@/types/worship.types';

interface AiSearchPanelProps {
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
  quotaExhausted: boolean;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
  isCoolingDown: boolean;
  cooldownSecsLeft: number;
  songQueue: SongResult[];
  onSearch: () => void;
  onFetchLyrics: (idx: number) => void;
  onSelectSong: (song: SongResult) => void;
  onRemoveFromQueue: (song: SongResult) => void;
}

export const AiSearchPanel: FC<AiSearchPanelProps> = ({
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
  quotaLoading,
  quotaExhausted,
  quotaUsed,
  quotaRemaining,
  quotaLimit,
  isCoolingDown,
  cooldownSecsLeft,
  songQueue,
  onSearch,
  onFetchLyrics,
  onSelectSong,
  onRemoveFromQueue,
}) => {
  return (
    <div className='flex flex-col gap-3 flex-1 min-h-0'>
      {/* Search input */}
      <div className='flex gap-2 shrink-0'>
        <input
          type='text'
          value={aiDescription}
          onChange={(e) => {
            setAiDescription(e.target.value);
            setAiError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !quotaExhausted && !isCoolingDown)
              onSearch();
          }}
          placeholder={
            quotaExhausted
              ? 'Daily search limit reached — resets tomorrow'
              : 'Song title, lyric, theme, scripture…'
          }
          className='flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
          disabled={aiLoading || quotaExhausted}
        />
        <button
          onClick={onSearch}
          disabled={aiLoading || !aiDescription.trim() || quotaExhausted || isCoolingDown}
          className='flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0'
        >
          {aiLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : isCoolingDown ? (
            <span className='tabular-nums text-xs'>{cooldownSecsLeft}s</span>
          ) : (
            <Sparkles className='h-4 w-4' />
          )}
          {aiLoading ? 'Searching…' : isCoolingDown ? 'Wait' : 'Search'}
        </button>
      </div>

      {/* Quota bar */}
      <div className='flex items-center gap-2 shrink-0'>
        <div className='flex-1 h-1 rounded-full bg-border overflow-hidden'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quotaLoading
                ? 'bg-muted-foreground/30 animate-pulse w-full'
                : quotaExhausted
                  ? 'bg-destructive'
                  : quotaUsed >= quotaLimit * 0.7
                    ? 'bg-yellow-500'
                    : 'bg-primary'
            }`}
            style={
              quotaLoading
                ? undefined
                : { width: `${Math.min(100, (quotaUsed / quotaLimit) * 100)}%` }
            }
          />
        </div>
        <p
          className={`text-[11px] shrink-0 tabular-nums ${
            quotaExhausted ? 'text-destructive font-medium' : 'text-muted-foreground'
          }`}
        >
          {quotaLoading
            ? '…'
            : quotaExhausted
              ? 'Limit reached — resets tomorrow'
              : `${quotaRemaining} / ${quotaLimit} searches left today`}
        </p>
      </div>

      {aiError && (
        <p className='text-xs text-destructive shrink-0'>{aiError}</p>
      )}

      {/* Results */}
      {aiResults.length > 0 && (
        <div className='flex flex-col gap-2 overflow-y-auto flex-1 min-h-0'>
          <p className='text-xs text-muted-foreground shrink-0'>
            {aiResults.length} result{aiResults.length !== 1 ? 's' : ''} found
          </p>
          {aiResults.map((song, i) => {
            const isSelected = songQueue.some(
              (s) => s.title === song.title && s.artist === song.artist,
            );
            const isExpanded = expandedIdx === i;
            const excerpt = song.excerpt?.trim() ?? '';
            const meta = [song.album, song.year].filter(Boolean).join(' · ');

            return (
              <div
                key={i}
                className={`rounded-lg border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background'
                }`}
              >
                <div className='flex items-start gap-2 px-3 py-2.5'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5'>
                      {isSelected && (
                        <Check className='h-3 w-3 text-primary shrink-0' />
                      )}
                      <p className='text-sm font-medium leading-tight truncate'>
                        {song.title}
                      </p>
                    </div>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {song.artist}
                    </p>
                    {meta && (
                      <p className='text-[11px] text-muted-foreground/60 mt-0.5'>
                        {meta}
                      </p>
                    )}
                    {excerpt && (
                      <p
                        className={`text-xs text-muted-foreground/70 mt-1.5 font-mono leading-relaxed whitespace-pre-wrap ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {excerpt}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex flex-col border-t border-border/50'>
                  <div className='flex items-center gap-1 px-3 py-1.5 flex-wrap'>
                    {excerpt && (
                      <>
                        <button
                          onClick={() => setExpandedIdx(isExpanded ? null : i)}
                          className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
                        >
                          {isExpanded ? 'Show less' : 'Show excerpt'}
                        </button>
                        <span className='text-muted-foreground/40 text-[11px]'>·</span>
                      </>
                    )}
                    <button
                      onClick={() => onFetchLyrics(i)}
                      disabled={fetchingIdx === i}
                      className='flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {fetchingIdx === i ? (
                        <>
                          <Loader2 className='h-2.5 w-2.5 animate-spin' /> Fetching…
                        </>
                      ) : (
                        'Fetch lyrics'
                      )}
                    </button>
                    <span className='text-muted-foreground/40 text-[11px]'>·</span>
                    {isSelected ? (
                      <button
                        onClick={() => onRemoveFromQueue(song)}
                        className='text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors'
                      >
                        Remove
                      </button>
                    ) : aiRoleInputIdx === i ? (
                      <button
                        onClick={() => setAiRoleInputIdx(null)}
                        className='text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors'
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAiRoleInputIdx(i);
                          setAiRoleInputValue('');
                        }}
                        className='text-[11px] font-medium text-primary hover:text-primary/80 transition-colors'
                      >
                        Add to set
                      </button>
                    )}
                  </div>
                  {/* Role input shown when "Add to set" is clicked */}
                  {!isSelected && aiRoleInputIdx === i && (
                    <div className='flex items-center gap-2 px-3 pb-2'>
                      <input
                        type='text'
                        placeholder='Role (e.g. Opening Song) — optional'
                        value={aiRoleInputValue}
                        onChange={(e) => setAiRoleInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSelectSong({
                              ...song,
                              role: aiRoleInputValue.trim() || undefined,
                            });
                            setAiRoleInputIdx(null);
                          }
                          if (e.key === 'Escape') setAiRoleInputIdx(null);
                        }}
                        autoFocus
                        className='flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring'
                      />
                      <button
                        onClick={() => {
                          onSelectSong({
                            ...song,
                            role: aiRoleInputValue.trim() || undefined,
                          });
                          setAiRoleInputIdx(null);
                        }}
                        className='rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium hover:opacity-90 transition-opacity shrink-0'
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!aiLoading && aiResults.length === 0 && !aiError && (
        <p className='text-xs text-muted-foreground'>
          Search by song title, partial lyric, theme, or scripture reference.
        </p>
      )}
    </div>
  );
};
