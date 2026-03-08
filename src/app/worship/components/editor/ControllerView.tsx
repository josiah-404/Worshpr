'use client';

import { type FC } from 'react';
import {
  ArrowLeft,
  MonitorOff,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PREVIEW_FONT_SIZES, CONTROLLER_FONT_SIZES } from '@/lib/constants';
import { SlidePreview } from '@/app/worship/components/SlidePreview';
import { BackgroundPicker } from '@/app/worship/components/BackgroundPicker';
import { SettingsDrawer } from '@/app/worship/components/SettingsDrawer';
import { SlidesPanel } from './SlidesPanel';

interface ControllerViewProps {
  title: string;
  slides: string[];
  current: number;
  currentSlide: string | undefined;
  nextSlide: string | undefined;
  bgCls: string;
  currentFamily: string;
  sizeId: string;
  bgId: string;
  transitionId: string;
  fontId: string;
  transSpeed: string;
  animSpeed: string;
  mode: 'editor' | 'controller';
  bgDialogOpen: boolean;
  setBgDialogOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  activeSlideRef: React.RefObject<HTMLButtonElement> | null;
  onBackToEditor: () => void;
  onGoTo: (i: number) => void;
  onChangeBg: (id: string) => void;
  onChangeTr: (id: string) => void;
  onChangeFont: (id: string) => void;
  onChangeSize: (id: string) => void;
  onChangeTransSpeed: (id: string) => void;
  onChangeAnimSpeed: (id: string) => void;
  onOpenPresenter: () => void;
  onEndPresentation: () => void;
}

export const ControllerView: FC<ControllerViewProps> = ({
  title,
  slides,
  current,
  currentSlide,
  nextSlide,
  bgCls,
  currentFamily,
  sizeId,
  bgId,
  transitionId,
  fontId,
  transSpeed,
  animSpeed,
  mode,
  bgDialogOpen,
  setBgDialogOpen,
  settingsOpen,
  setSettingsOpen,
  activeSlideRef,
  onBackToEditor,
  onGoTo,
  onChangeBg,
  onChangeTr,
  onChangeFont,
  onChangeSize,
  onChangeTransSpeed,
  onChangeAnimSpeed,
  onOpenPresenter,
  onEndPresentation,
}) => {
  return (
    <div className='flex flex-col gap-4 flex-1 min-h-0'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <button
            onClick={onBackToEditor}
            className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
            Editor
          </button>
          <span className='text-border'>|</span>
          <div className='flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />
            <span className='text-sm font-semibold'>
              {title || 'Untitled'} — Slide{' '}
              {slides.length > 0 ? current + 1 : 0} of {slides.length}
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setSettingsOpen(true)}
            className='inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors'
          >
            <SlidersHorizontal className='h-4 w-4' />
            Settings
          </button>
          <button
            onClick={onEndPresentation}
            className='inline-flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors'
          >
            <MonitorOff className='h-4 w-4' />
            End Presentation
          </button>
        </div>
      </div>

      {/* Main */}
      <div className='flex gap-5 min-h-0 flex-1'>
        {/* Left: Slide list + Up Next */}
        <div className='w-56 shrink-0 flex flex-col gap-3 min-h-0'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest shrink-0'>
            Slides
          </p>
          <div className='space-y-1 flex-1 overflow-y-auto pr-1 min-h-0'>
            <SlidesPanel
              slides={slides}
              current={current}
              activeSlideRef={activeSlideRef}
              onGoTo={onGoTo}
            />
          </div>
          {/* Up Next */}
          <div className='shrink-0 pb-1'>
            <p className='text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-1.5'>
              Up Next
            </p>
            <SlidePreview
              slide={nextSlide ?? ''}
              bgCls={bgCls}
              fontFamily={currentFamily}
              fontSize={PREVIEW_FONT_SIZES[sizeId]}
              emptyText='End of slides'
              paused
            />
          </div>
        </div>

        {/* Right: Live preview with nav overlay */}
        <div className='flex-1 min-w-0 flex flex-col gap-2'>
          <p className='text-[11px] font-medium uppercase tracking-widest flex items-center gap-1.5 shrink-0'>
            <span className='h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse' />
            <span className='text-green-500'>Live Now</span>
          </p>
          <div className='relative flex-1 min-h-0'>
            <SlidePreview
              slide={currentSlide ?? ''}
              bgCls={bgCls}
              fontFamily={currentFamily}
              fontSize={CONTROLLER_FONT_SIZES[sizeId]}
              ringClass='ring-2 ring-green-500/25 h-full'
            />
            {/* Nav overlay */}
            <div className='absolute inset-x-0 bottom-4 flex items-center justify-between px-5 pointer-events-none'>
              <button
                onClick={() => onGoTo(current - 1)}
                disabled={current === 0}
                className='pointer-events-auto flex items-center gap-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-black/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed'
              >
                <ChevronLeft className='h-4 w-4' />
                Prev
              </button>
              <span className='text-xs text-white/40 bg-black/25 backdrop-blur-sm rounded-full px-3 py-1'>
                {slides.length > 0 ? `${current + 1} / ${slides.length}` : '—'}
              </span>
              <button
                onClick={() => onGoTo(current + 1)}
                disabled={current >= slides.length - 1}
                className='pointer-events-auto flex items-center gap-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-black/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed'
              >
                Next
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BackgroundPicker
        open={bgDialogOpen}
        selected={bgId}
        onSelect={onChangeBg}
        onClose={() => setBgDialogOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        bgId={bgId}
        transitionId={transitionId}
        fontId={fontId}
        sizeId={sizeId}
        transSpeed={transSpeed}
        animSpeed={animSpeed}
        mode={mode}
        onChangeBg={onChangeBg}
        onChangeTr={onChangeTr}
        onChangeFont={onChangeFont}
        onChangeSize={onChangeSize}
        onChangeTransSpeed={onChangeTransSpeed}
        onChangeAnimSpeed={onChangeAnimSpeed}
        onOpenBgPicker={() => setBgDialogOpen(true)}
        onOpenPresenter={onOpenPresenter}
        onEndPresentation={onEndPresentation}
      />
    </div>
  );
};
