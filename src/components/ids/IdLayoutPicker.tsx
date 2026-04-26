'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { ID_LAYOUT_LIST } from '@/lib/idLayouts';
import { IdLayoutThumbnail } from '@/components/ids/IdLayoutThumbnail';

interface IdLayoutPickerProps {
  value: string;
  onChange: (id: string) => void;
  overlayColor?: string;
}

export const IdLayoutPicker: FC<IdLayoutPickerProps> = ({ value, onChange, overlayColor }) => (
  <div className="grid grid-cols-2 gap-1.5">
    {ID_LAYOUT_LIST.map((layout) => {
      const selected = value === layout.id;
      return (
        <button
          key={layout.id}
          type="button"
          onClick={() => onChange(layout.id)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all',
            selected
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border/60 hover:border-border hover:bg-accent/40',
          )}
        >
          <IdLayoutThumbnail layout={layout} overlayColor={overlayColor} />
          <p className={cn(
            'text-[9px] font-semibold leading-tight tracking-wide',
            selected ? 'text-primary' : 'text-muted-foreground',
          )}>
            {layout.label}
          </p>
        </button>
      );
    })}
  </div>
);
