'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { ID_SIZE_LIST } from '@/lib/idSizes';
import type { IdSizeId } from '@/types/id.types';

interface IdSizeSelectorProps {
  value: IdSizeId;
  onChange: (id: IdSizeId) => void;
}

export const IdSizeSelector: FC<IdSizeSelectorProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {ID_SIZE_LIST.map((size) => {
      const selected = value === size.id;
      const isLandscape = size.orientation === 'landscape';
      return (
        <button
          key={size.id}
          type="button"
          onClick={() => onChange(size.id)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border p-3 text-left transition-colors',
            selected
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <div className="flex items-center justify-center">
            <div
              className={cn('rounded-sm border-2', selected ? 'border-primary' : 'border-muted-foreground/40')}
              style={{
                width:  isLandscape ? 36 : 24,
                height: isLandscape ? 24 : 36,
              }}
            />
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">{size.label}</p>
            <p className="text-[10px] text-muted-foreground">{size.widthMm}×{size.heightMm} mm</p>
          </div>
        </button>
      );
    })}
  </div>
);
