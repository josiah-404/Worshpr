"use client";

import { LayoutGrid } from "lucide-react";
import { BACKGROUNDS, TRANSITIONS, FONTS, SIZES } from '@/lib/constants';

interface OptionsToolbarProps {
  bgId:         string;
  transitionId: string;
  fontId:       string;
  sizeId:       string;
  onChangeBg:   (id: string) => void;
  onChangeTr:   (id: string) => void;
  onChangeFont: (id: string) => void;
  onChangeSize: (id: string) => void;
  onOpenBgPicker: () => void;
}

export function OptionsToolbar({
  bgId, transitionId, fontId, sizeId,
  onChangeBg, onChangeTr, onChangeFont, onChangeSize,
  onOpenBgPicker,
}: OptionsToolbarProps) {
  const activeBg = BACKGROUNDS.find((b) => b.id === bgId)!;
  const featuredBgs = [activeBg, ...BACKGROUNDS.filter((b) => b.id !== bgId).slice(0, 3)];

  return (
    <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Background */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">BG</span>
        <div className="flex gap-1">
          {featuredBgs.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onChangeBg(bg.id)}
              className={`relative h-6 w-14 rounded overflow-hidden transition-all ${bg.cls} ${
                bgId === bg.id
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : "opacity-55 hover:opacity-100"
              }`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
                {bg.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onOpenBgPicker}
          className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
        >
          <LayoutGrid className="h-2.5 w-2.5" />more
        </button>
      </div>

      <span className="text-border text-xs">|</span>

      {/* Transition */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Transition</span>
        <div className="flex gap-1">
          {TRANSITIONS.map((tr) => (
            <button
              key={tr.id}
              onClick={() => onChangeTr(tr.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                transitionId === tr.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      <span className="text-border text-xs">|</span>

      {/* Font */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Font</span>
        <div className="flex gap-1">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => onChangeFont(f.id)}
              style={{ fontFamily: f.family }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                fontId === f.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <span className="text-border text-xs">|</span>

      {/* Size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Size</span>
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => onChangeSize(s.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                sizeId === s.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
