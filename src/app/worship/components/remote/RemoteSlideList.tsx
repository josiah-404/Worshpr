import { type FC } from 'react';
import { ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { RemoteSlideText } from './RemoteSlideText';

interface RemoteSlideListProps {
  slides: string[];
  current: number;
  onSelect: (index: number) => void;
}

/** Bottom sheet listing every slide so the phone can jump straight to one. */
export const RemoteSlideList: FC<RemoteSlideListProps> = ({ slides, current, onSelect }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='outline' size='sm' className='gap-1.5'>
        <ListOrdered className='h-4 w-4' />
        Slides
      </Button>
    </SheetTrigger>
    <SheetContent side='bottom' className='max-h-[80svh] overflow-y-auto'>
      <SheetHeader>
        <SheetTitle>Jump to slide</SheetTitle>
      </SheetHeader>
      <div className='mt-4 flex flex-col gap-2'>
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              i === current ? 'border-green-500/50 bg-green-500/10' : 'border-border hover:bg-accent/60',
            )}
          >
            <span className='w-6 shrink-0 text-xs font-medium text-muted-foreground'>{i + 1}</span>
            <div className='min-w-0 flex-1'>
              <RemoteSlideText slide={slide} compact />
            </div>
          </button>
        ))}
      </div>
    </SheetContent>
  </Sheet>
);
