'use client';

import { type FC } from 'react';
import { ClipboardPaste, Sparkles, BookOpen, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseLyrics, needsParsing } from '@/lib/lyricsParser';
import type { AddMode } from '@/hooks/useEditorState';

interface AddSongDialogProps {
  addMode: AddMode;
  setAddMode: (mode: AddMode) => void;
  onClose: () => void;

  // Manual form
  manualRole: string;
  setManualRole: (v: string) => void;
  manualTitle: string;
  setManualTitle: (v: string) => void;
  manualArtist: string;
  setManualArtist: (v: string) => void;
  manualLyricsText: string;
  setManualLyricsText: (v: string) => void;
  onAddManualSong: () => void;

  // Section form
  sectionLabel: string;
  setSectionLabel: (v: string) => void;
  onAddSection: () => void;

  // AI option
  onSwitchToAi: () => void;
}

export const AddSongDialog: FC<AddSongDialogProps> = ({
  addMode,
  setAddMode,
  onClose,
  manualRole,
  setManualRole,
  manualTitle,
  setManualTitle,
  manualArtist,
  setManualArtist,
  manualLyricsText,
  setManualLyricsText,
  onAddManualSong,
  sectionLabel,
  setSectionLabel,
  onAddSection,
  // onSwitchToAi,
}) => {
  return (
    <div className='rounded-lg border border-border bg-background shadow-sm shrink-0'>
      {addMode === 'choose' && (
        <div className='p-3 flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-medium'>Add a song</p>
            <button
              onClick={onClose}
              className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
            >
              ✕
            </button>
          </div>
          <div className='flex flex-col gap-1.5'>
            <button
              onClick={() => setAddMode('manual')}
              className='flex items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left hover:bg-accent/60 transition-colors'
            >
              <ClipboardPaste className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
              <span className='flex flex-col gap-0.5'>
                <span className='text-xs font-medium'>Paste manually</span>
                <span className='text-[11px] text-muted-foreground'>
                  Enter title &amp; paste lyrics
                </span>
              </span>
            </button>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='cursor-not-allowed'>
                    <button
                      disabled
                      className='flex w-full items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left opacity-40 pointer-events-none'
                    >
                      <Sparkles className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                      <span className='flex flex-col gap-0.5'>
                        <span className='text-xs font-medium'>AI Search</span>
                        <span className='text-[11px] text-muted-foreground'>
                          Find lyrics automatically
                        </span>
                      </span>
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className='bg-popover text-popover-foreground border border-border shadow-md'>
                  Not yet stable — coming soon
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button
              onClick={() => {
                setAddMode('section');
                setSectionLabel('');
              }}
              className='flex items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left hover:bg-accent/60 transition-colors'
            >
              <BookOpen className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
              <span className='flex flex-col gap-0.5'>
                <span className='text-xs font-medium'>Section slide</span>
                <span className='text-[11px] text-muted-foreground'>
                  e.g. Testimony, Word of God
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {addMode === 'manual' && (
        <div className='p-3 flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-medium'>Add song manually</p>
            <button
              onClick={() => {
                onClose();
                setManualTitle('');
                setManualArtist('');
                setManualRole('');
                setManualLyricsText('');
              }}
              className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
            >
              ✕
            </button>
          </div>
          <input
            type='text'
            placeholder='Role (e.g. Opening Song, Worship Song)'
            value={manualRole}
            onChange={(e) => setManualRole(e.target.value)}
            className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          />
          <div className='grid grid-cols-2 gap-2'>
            <input
              type='text'
              placeholder='Song title *'
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            />
            <input
              type='text'
              placeholder='Artist'
              value={manualArtist}
              onChange={(e) => setManualArtist(e.target.value)}
              className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            />
          </div>
          <Textarea
            placeholder={
              'Paste lyrics here…\n\nSeparate slides with a blank line'
            }
            value={manualLyricsText}
            onChange={(e) => setManualLyricsText(e.target.value)}
            rows={5}
            className='font-mono leading-relaxed resize-none'
          />
          <div className='flex items-center justify-between gap-2'>
            {needsParsing(manualLyricsText) ? (
              <button
                onClick={() =>
                  setManualLyricsText(parseLyrics(manualLyricsText))
                }
                className='flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 transition-colors'
              >
                <Wand2 className='h-3 w-3' />
                Format
              </button>
            ) : (
              <span />
            )}
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setAddMode('choose')}
                className='rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                Back
              </button>
              <button
                onClick={onAddManualSong}
                disabled={!manualTitle.trim()}
                className='rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Add to set
              </button>
            </div>
          </div>
        </div>
      )}

      {addMode === 'section' && (
        <div className='p-3 flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-medium'>Add section slide</p>
            <button
              onClick={() => {
                onClose();
                setSectionLabel('');
              }}
              className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
            >
              ✕
            </button>
          </div>
          <input
            type='text'
            placeholder='Label (e.g. Testimony, Word of God, Offering)'
            value={sectionLabel}
            onChange={(e) => setSectionLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddSection();
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          />
          <p className='text-[11px] text-muted-foreground'>
            Creates a single announcement slide with no lyrics.
          </p>
          <div className='flex items-center justify-end gap-2'>
            <button
              onClick={() => setAddMode('choose')}
              className='rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Back
            </button>
            <button
              onClick={onAddSection}
              disabled={!sectionLabel.trim()}
              className='rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Add slide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
