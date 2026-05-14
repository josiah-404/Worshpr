'use client';

import { type FC } from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ID_SIZE_LIST } from '@/lib/idSizes';
import type { IdSizeId } from '@/types/id.types';

interface IdSizeSelectorProps {
  value: IdSizeId;
  onChange: (id: IdSizeId) => void;
  customWidthMm: number;
  customHeightMm: number;
  onCustomChange: (widthMm: number, heightMm: number) => void;
}

export const IdSizeSelector: FC<IdSizeSelectorProps> = ({
  value,
  onChange,
  customWidthMm,
  customHeightMm,
  onCustomChange,
}) => {
  const isCustom = value === 'custom';

  return (
    <div className="space-y-2">
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
                  style={{ width: isLandscape ? 36 : 24, height: isLandscape ? 24 : 36 }}
                />
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">{size.label}</p>
                <p className="text-[10px] text-muted-foreground">{size.widthMm}×{size.heightMm} mm</p>
              </div>
            </button>
          );
        })}

        {/* Custom tile */}
        <button
          type="button"
          onClick={() => onChange('custom')}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border p-3 text-left transition-colors',
            isCustom
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border border-dashed text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <div className="flex items-center justify-center">
            <Maximize2 className={cn('h-5 w-5', isCustom ? 'text-primary' : 'text-muted-foreground/40')} />
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">Custom Size</p>
            <p className="text-[10px] text-muted-foreground">
              {isCustom ? `${customWidthMm}×${customHeightMm} mm` : 'Set your own'}
            </p>
          </div>
        </button>
      </div>

      {/* Custom inputs — shown only when custom is selected */}
      {isCustom && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            Custom Dimensions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Width (mm)</label>
              <input
                type="number"
                min={10}
                max={600}
                step={0.1}
                value={customWidthMm}
                onChange={(e) => onCustomChange(Number(e.target.value) || 85.6, customHeightMm)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Height (mm)</label>
              <input
                type="number"
                min={10}
                max={600}
                step={0.1}
                value={customHeightMm}
                onChange={(e) => onCustomChange(customWidthMm, Number(e.target.value) || 54)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground/50">
            {Math.round(customWidthMm / 25.4 * 100) / 100}&quot;
            {' × '}
            {Math.round(customHeightMm / 25.4 * 100) / 100}&quot;
            {' — '}
            {Math.round(customWidthMm * 11.811)} × {Math.round(customHeightMm * 11.811)} px @ 300dpi
          </p>
        </div>
      )}
    </div>
  );
};
