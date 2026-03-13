'use client';

import { type FC, useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import {
  BACKGROUNDS,
  TRANSITIONS,
  FONTS,
  SIZES,
  SPEEDS,
  PREVIEW_FONT_SIZES,
} from '@/lib/constants';
import { SlidePreview } from '@/app/worship/components/SlidePreview';
import { BackgroundPicker } from '@/app/worship/components/BackgroundPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BgThumbProps {
  bgCls: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function BgThumb({ bgCls, label, selected, onClick }: BgThumbProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [scale, setScale] = useState(0.1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) =>
      setScale(e.contentRect.width / 1920),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative rounded-md overflow-hidden transition-all ${
        selected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'opacity-60 hover:opacity-100'
      }`}
      style={{ aspectRatio: '16/5' }}
    >
      <div
        className={`${bgCls} animations-paused`}
        style={{
          position: 'absolute',
          width: '1920px',
          height: '1080px',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      />
      <span
        className='absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white drop-shadow-md'
        style={{ zIndex: 1 }}
      >
        {label}
      </span>
    </button>
  );
}

interface PreviewPanelProps {
  currentSlide: string | undefined;
  nextSlide?: string | undefined;
  bgCls: string;
  currentFamily: string;
  sizeId: string;
  slides: string[];
  current: number;
  bgId: string;
  transitionId: string;
  fontId: string;
  transSpeed: string;
  animSpeed: string;
  bgDialogOpen: boolean;
  setBgDialogOpen: (open: boolean) => void;
  onGoTo: (i: number) => void;
  onChangeBg: (id: string) => void;
  onChangeTr: (id: string) => void;
  onChangeFont: (id: string) => void;
  onChangeSize: (id: string) => void;
  onChangeTransSpeed: (id: string) => void;
  onChangeAnimSpeed: (id: string) => void;
}

export const PreviewPanel: FC<PreviewPanelProps> = ({
  currentSlide,
  bgCls,
  currentFamily,
  sizeId,
  slides,
  current,
  bgId,
  transitionId,
  fontId,
  transSpeed,
  animSpeed,
  bgDialogOpen,
  setBgDialogOpen,
  onGoTo,
  onChangeBg,
  onChangeTr,
  onChangeFont,
  onChangeSize,
  onChangeTransSpeed,
  onChangeAnimSpeed,
}) => {
  return (
    <div className='flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto min-h-0'>
      {/* Preview */}
      <div className='space-y-1.5 shrink-0'>
        <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
          Preview
        </p>
        <SlidePreview
          slide={currentSlide ?? ''}
          bgCls={`rounded-lg ${bgCls}`}
          fontFamily={currentFamily}
          fontSize={PREVIEW_FONT_SIZES[sizeId]}
          emptyText='Paste lyrics to preview'
          paused
        />
        {slides.length > 0 && (
          <div className='flex items-center justify-between gap-2 pt-0.5'>
            <button
              onClick={() => onGoTo(current - 1)}
              disabled={current === 0}
              className='flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
            >
              <ChevronLeft className='h-3.5 w-3.5' />
              Prev
            </button>
            <span className='text-[11px] text-muted-foreground'>
              {current + 1} / {slides.length}
            </span>
            <button
              onClick={() => onGoTo(current + 1)}
              disabled={current === slides.length - 1}
              className='flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
            >
              Next
              <ChevronRight className='h-3.5 w-3.5' />
            </button>
          </div>
        )}
      </div>

      {/* Background */}
      <div className='space-y-2 shrink-0'>
        <div className='flex items-center justify-between'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
            Background
          </p>
          <button
            onClick={() => setBgDialogOpen(true)}
            className='flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors'
          >
            <LayoutGrid className='h-2.5 w-2.5' />
            See all
          </button>
        </div>
        <div className='grid grid-cols-3 gap-1.5 p-1'>
          {BACKGROUNDS.slice(0, 6).map((bg) => (
            <BgThumb
              key={bg.id}
              bgCls={bg.cls}
              label={bg.label}
              selected={bgId === bg.id}
              onClick={() => onChangeBg(bg.id)}
            />
          ))}
        </div>
      </div>

      {/* Transition */}
      <div className='space-y-2 shrink-0'>
        <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
          Transition
        </p>
        <div className='grid grid-cols-2 gap-1.5'>
          {TRANSITIONS.map((tr) => (
            <button
              key={tr.id}
              onClick={() => onChangeTr(tr.id)}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                transitionId === tr.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transition Speed + Animation Speed */}
      <div className='grid grid-cols-2 gap-4 shrink-0'>
        <div className='space-y-2'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
            Transition Speed
          </p>
          <div className='flex flex-col gap-1.5'>
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChangeTransSpeed(s.id)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                  transSpeed === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className='space-y-2'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
            Animation Speed
          </p>
          <div className='flex flex-col gap-1.5'>
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChangeAnimSpeed(s.id)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                  animSpeed === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font + Text Size */}
      <div className='grid grid-cols-2 gap-4 shrink-0 pb-4'>
        <div className='space-y-2'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
            Font
          </p>
          <Select value={fontId} onValueChange={onChangeFont}>
            <SelectTrigger
              className='w-full'
              style={{ fontFamily: FONTS.find((f) => f.id === fontId)?.family }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.family }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
            Text Size
          </p>
          <Select value={sizeId} onValueChange={onChangeSize}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <BackgroundPicker
        open={bgDialogOpen}
        selected={bgId}
        onSelect={onChangeBg}
        onClose={() => setBgDialogOpen(false)}
      />
    </div>
  );
};
