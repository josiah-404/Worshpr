'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';

export interface IdFont {
  id: string;
  label: string;
  category: 'sans' | 'serif' | 'display' | 'script';
}

export const ID_FONTS: IdFont[] = [
  { id: 'Poppins',           label: 'Poppins',         category: 'sans'    },
  { id: 'Montserrat',        label: 'Montserrat',       category: 'sans'    },
  { id: 'Raleway',           label: 'Raleway',          category: 'sans'    },
  { id: 'Lato',              label: 'Lato',             category: 'sans'    },
  { id: 'Nunito',            label: 'Nunito',           category: 'sans'    },
  { id: 'Oswald',            label: 'Oswald',           category: 'display' },
  { id: 'Bebas Neue',        label: 'Bebas Neue',       category: 'display' },
  { id: 'Cinzel',            label: 'Cinzel',           category: 'display' },
  { id: 'Playfair Display',  label: 'Playfair',         category: 'serif'   },
  { id: 'Lora',              label: 'Lora',             category: 'serif'   },
  { id: 'EB Garamond',       label: 'EB Garamond',      category: 'serif'   },
  { id: 'Dancing Script',    label: 'Dancing Script',   category: 'script'  },
];

const CATEGORY_LABEL: Record<string, string> = {
  sans: 'Sans-serif',
  display: 'Display',
  serif: 'Serif',
  script: 'Script',
};

interface IdFontPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export const IdFontPicker: FC<IdFontPickerProps> = ({ value, onChange }) => {
  const grouped = ['sans', 'display', 'serif', 'script'] as const;

  return (
    <div className="space-y-3">
      {grouped.map((cat) => {
        const fonts = ID_FONTS.filter((f) => f.category === cat);
        return (
          <div key={cat} className="space-y-1">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/50">
              {CATEGORY_LABEL[cat]}
            </p>
            <div className="space-y-0.5">
              {fonts.map((font) => {
                const selected = value === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onChange(font.id)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-md px-3 py-2 text-left transition-colors',
                      selected
                        ? 'bg-primary/15 text-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    )}
                  >
                    <span
                      className="text-sm leading-none"
                      style={{ fontFamily: `"${font.id}", sans-serif` }}
                    >
                      {font.label}
                    </span>
                    <span
                      className="text-xs text-muted-foreground/60 leading-none"
                      style={{ fontFamily: `"${font.id}", sans-serif` }}
                    >
                      Aa
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
