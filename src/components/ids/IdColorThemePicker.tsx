'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorTheme {
  id: string;
  label: string;
  hex: string;
  preview: string; // tailwind gradient class for the swatch
}

const COLOR_THEMES: ColorTheme[] = [
  { id: '#000000', label: 'Midnight',  hex: '#000000', preview: 'from-black to-gray-900' },
  { id: '#0a1f0e', label: 'Forest',    hex: '#0a1f0e', preview: 'from-green-950 to-green-900' },
  { id: '#0a0f1f', label: 'Navy',      hex: '#0a0f1f', preview: 'from-blue-950 to-blue-900' },
  { id: '#1a0a2e', label: 'Amethyst',  hex: '#1a0a2e', preview: 'from-purple-950 to-purple-900' },
  { id: '#1f0a00', label: 'Ember',     hex: '#1f0a00', preview: 'from-orange-950 to-orange-900' },
  { id: '#0f1520', label: 'Steel',     hex: '#0f1520', preview: 'from-slate-900 to-slate-800' },
  { id: '#1f0505', label: 'Crimson',   hex: '#1f0505', preview: 'from-red-950 to-red-900' },
  { id: '#0d1a0d', label: 'Olive',     hex: '#0d1a0d', preview: 'from-lime-950 to-lime-900' },
];

interface IdColorThemePickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export const IdColorThemePicker: FC<IdColorThemePickerProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-4 gap-2">
      {COLOR_THEMES.map((theme) => {
        const selected = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            title={theme.label}
            onClick={() => onChange(theme.id)}
            className={cn(
              'relative h-10 rounded-md bg-gradient-to-br transition-all',
              theme.preview,
              selected
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'opacity-70 hover:opacity-100',
            )}
          >
            {selected && (
              <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
            )}
          </button>
        );
      })}
    </div>
    <p className="text-[10px] text-muted-foreground text-center">
      {COLOR_THEMES.find((t) => t.id === value)?.label ?? 'Custom'} overlay
    </p>

    {/* Custom color input */}
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        title="Custom color"
      />
      <span className="text-xs text-muted-foreground font-mono">{value}</span>
    </div>
  </div>
);
