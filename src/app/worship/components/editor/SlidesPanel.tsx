'use client';

import { type FC } from 'react';
import { parseTitleSlide } from '@/lib/constants';

interface SlidesPanelProps {
  slides: string[];
  current: number;
  activeSlideRef: React.RefObject<HTMLButtonElement> | null;
  onGoTo: (i: number) => void;
}

export const SlidesPanel: FC<SlidesPanelProps> = ({
  slides,
  current,
  activeSlideRef,
  onGoTo,
}) => {
  return (
    <div className='w-52 shrink-0 flex flex-col gap-3 min-h-0'>
      <p className='text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest shrink-0'>
        Slides{' '}
        {slides.length > 0 && (
          <span className='text-muted-foreground/40'>({slides.length})</span>
        )}
      </p>
      <div className='flex-1 overflow-y-auto space-y-1 pr-1'>
        {slides.length === 0 ? (
          <p className='text-xs text-muted-foreground/50 px-2 py-2 leading-relaxed'>
            Paste lyrics in the editor to generate slides
          </p>
        ) : (
          <>
            {slides.map((slide, i) => (
              <button
                key={i}
                ref={i === current ? activeSlideRef : null}
                onClick={() => onGoTo(i)}
                className={`w-full text-left rounded-md px-3 py-2 text-xs leading-snug transition-colors ${
                  i === current
                    ? 'bg-primary/15 border border-primary/30 text-foreground'
                    : 'border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <span className='text-[10px] font-medium text-muted-foreground/50 mr-1.5'>
                  {i + 1}.
                </span>
                <SlideLabel slide={slide} />
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

function SlideLabel({ slide }: { slide: string }) {
  const titleParts = parseTitleSlide(slide);
  if (titleParts) {
    if (titleParts.isSection) {
      return (
        <span className='font-semibold uppercase tracking-wide text-[10px] opacity-80'>
          {titleParts.role}
        </span>
      );
    }
    return (
      <span className='inline-flex flex-col gap-0.5 leading-none'>
        {titleParts.role && (
          <span className='text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60 not-italic'>
            {titleParts.role}
          </span>
        )}
        <span className='italic opacity-70'>{titleParts.title}</span>
      </span>
    );
  }
  return <>{slide.split('\n')[0]}</>;
}
