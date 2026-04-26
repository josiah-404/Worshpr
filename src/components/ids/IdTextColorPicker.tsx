'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TextColorPreset {
  label: string;
  hex: string;
  preview: string; // bg class
  textPreview: string; // text class for the swatch
}

const TEXT_COLOR_PRESETS: TextColorPreset[] = [
  { label: 'White',      hex: '#ffffff', preview: 'bg-white border border-border',       textPreview: 'text-gray-800' },
  { label: 'Black',      hex: '#1a1a1a', preview: 'bg-gray-900',                         textPreview: 'text-white' },
  { label: 'Gold',       hex: '#f5c542', preview: 'bg-yellow-400',                       textPreview: 'text-gray-900' },
  { label: 'Cream',      hex: '#f5e6c8', preview: 'bg-amber-100 border border-border',   textPreview: 'text-gray-700' },
  { label: 'Sky',        hex: '#7dd3fc', preview: 'bg-sky-300',                          textPreview: 'text-sky-900' },
  { label: 'Rose',       hex: '#fda4af', preview: 'bg-rose-300',                         textPreview: 'text-rose-900' },
  { label: 'Mint',       hex: '#6ee7b7', preview: 'bg-emerald-300',                      textPreview: 'text-emerald-900' },
  { label: 'Lavender',   hex: '#c4b5fd', preview: 'bg-violet-300',                       textPreview: 'text-violet-900' },
];

interface IdTextColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export const IdTextColorPicker: FC<IdTextColorPickerProps> = ({ value, onChange }) => {
  const matched = TEXT_COLOR_PRESETS.find((p) => p.hex === value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {TEXT_COLOR_PRESETS.map((preset) => {
          const selected = value === preset.hex;
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              onClick={() => onChange(preset.hex)}
              className={cn(
                'relative h-8 rounded-md transition-all flex items-center justify-center text-[11px] font-bold',
                preset.preview,
                preset.textPreview,
                selected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              {selected ? <Check className="h-3.5 w-3.5" /> : 'Aa'}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {matched?.label ?? 'Custom'} — secondary text at 75% opacity
      </p>

      {/* Custom color input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
          title="Custom text color"
        />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  );
};
