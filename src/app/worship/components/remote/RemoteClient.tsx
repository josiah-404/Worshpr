'use client';

import { type FC, type TouchEvent, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorshipRemoteClient } from '@/hooks/useWorshipRemoteClient';
import { cn } from '@/lib/utils';
import { RemoteSlideList } from './RemoteSlideList';
import { RemoteSlideText } from './RemoteSlideText';

interface RemoteClientProps {
  token: string;
}

const SWIPE_THRESHOLD_PX = 50;

export const RemoteClient: FC<RemoteClientProps> = ({ token }) => {
  const { state, status, send, retry } = useWorshipRemoteClient(token);
  const touchStartX = useRef<number | null>(null);

  useKeepScreenAwake();

  const current = state?.current ?? 0;
  const total = state?.total ?? 0;
  const currentSlide = state?.slides[current] ?? '';
  const nextSlide = state?.slides[current + 1] ?? '';
  const isFirst = current <= 0;
  const isLast = current >= total - 1;
  const isConnected = status === 'connected';

  const handlePrev = () => send({ action: 'prev' });
  const handleNext = () => send({ action: 'next' });
  const handleGoTo = (index: number) => send({ action: 'goto', index });

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (dx <= -SWIPE_THRESHOLD_PX && !isLast) handleNext();
    else if (dx >= SWIPE_THRESHOLD_PX && !isFirst) handlePrev();
  };

  if (!state) {
    return <RemoteWaiting status={status} onRetry={retry} />;
  }

  return (
    <div className='flex h-svh select-none flex-col gap-4 bg-background p-4 text-foreground'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-destructive',
            )}
          />
          <p className='truncate text-sm font-semibold'>{state.title || 'Untitled'}</p>
        </div>
        <RemoteSlideList slides={state.slides} current={current} onSelect={handleGoTo} />
      </div>

      {!isConnected && (
        <button onClick={retry} className='rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive'>
          Connection lost — tap to reconnect
        </button>
      )}

      {/* Live slide (swipe left = next, right = previous) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className='flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-green-500/30 bg-card p-5'
      >
        <p className='text-[11px] font-medium uppercase tracking-widest text-green-500'>
          Live · {total > 0 ? `${current + 1} / ${total}` : '—'}
        </p>
        <RemoteSlideText slide={currentSlide} emptyText='No slides' />
      </div>

      {/* Up next */}
      <div className='rounded-lg border border-border bg-muted/30 p-3'>
        <p className='mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>Up next</p>
        <RemoteSlideText slide={nextSlide} compact emptyText='End of slides' />
      </div>

      {/* Big nav buttons */}
      <div className='grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]'>
        <Button variant='outline' className='h-24 text-lg' disabled={isFirst} onClick={handlePrev}>
          <ChevronLeft className='mr-1 h-6 w-6' />
          Prev
        </Button>
        <Button className='h-24 text-lg' disabled={isLast} onClick={handleNext}>
          Next
          <ChevronRight className='ml-1 h-6 w-6' />
        </Button>
      </div>
    </div>
  );
};

/* ── Subcomponents / helpers ── */

interface RemoteWaitingProps {
  status: 'connecting' | 'connected' | 'disconnected';
  onRetry: () => void;
}

const RemoteWaiting: FC<RemoteWaitingProps> = ({ status, onRetry }) => {
  const isDisconnected = status === 'disconnected';
  return (
    <div className='flex h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center'>
      {isDisconnected ? (
        <WifiOff className='h-10 w-10 text-muted-foreground' />
      ) : (
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
      )}
      <div className='space-y-1'>
        <p className='font-semibold'>
          {isDisconnected ? 'Presentation not found' : 'Connecting to presentation…'}
        </p>
        <p className='text-sm text-muted-foreground'>
          {isDisconnected
            ? 'Make sure the presentation is live, then scan the QR code again.'
            : 'Keep this page open.'}
        </p>
      </div>
      {isDisconnected && (
        <Button variant='outline' onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};

/** Stops the phone screen from sleeping mid-service (silently no-ops where unsupported). */
function useKeepScreenAwake() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        lock = null;
      }
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      void lock?.release();
    };
  }, []);
}
