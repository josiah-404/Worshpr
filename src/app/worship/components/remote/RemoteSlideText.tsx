import { type FC } from 'react';
import { parseTitleSlide } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RemoteSlideTextProps {
  slide: string;
  /** Smaller text for the "Up next" card. */
  compact?: boolean;
  emptyText?: string;
}

/** Plain-text rendering of a slide for the phone remote (no backgrounds or animation). */
export const RemoteSlideText: FC<RemoteSlideTextProps> = ({ slide, compact, emptyText = '—' }) => {
  const titleParts = parseTitleSlide(slide);
  const sizeCls = compact ? 'text-sm' : 'text-lg sm:text-xl';

  if (!slide) {
    return <p className='text-sm text-muted-foreground/60 text-center'>{emptyText}</p>;
  }

  if (titleParts) {
    return (
      <div className='flex flex-col items-center gap-1 text-center'>
        {titleParts.role && (
          <p className='text-[11px] font-medium uppercase tracking-widest text-muted-foreground'>
            {titleParts.role}
          </p>
        )}
        {titleParts.title && <p className={cn('font-bold', sizeCls)}>{titleParts.title}</p>}
        {titleParts.artist && <p className='text-sm text-muted-foreground'>{titleParts.artist}</p>}
      </div>
    );
  }

  return (
    <p
      className={cn(
        'font-semibold leading-snug text-center whitespace-pre-line',
        sizeCls,
        compact && 'line-clamp-3 text-muted-foreground',
      )}
    >
      {slide}
    </p>
  );
};
