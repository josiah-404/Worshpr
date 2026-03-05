"use client";

import { X, Check } from "lucide-react";
import { BACKGROUNDS } from '@/lib/constants';

interface BackgroundPickerProps {
  open:     boolean;
  selected: string;
  onSelect: (id: string) => void;
  onClose:  () => void;
}

export function BackgroundPicker({ open, selected, onSelect, onClose }: BackgroundPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Choose Background</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {BACKGROUNDS.length} animated backgrounds available
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto">
          {BACKGROUNDS.map((bg) => {
            const isSelected = selected === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => { onSelect(bg.id); onClose(); }}
                className={`group relative rounded-lg overflow-hidden transition-all focus:outline-none ${
                  isSelected
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-card"
                    : "opacity-75 hover:opacity-100 hover:ring-1 hover:ring-white/20"
                }`}
              >
                <div className={`w-full ${bg.cls}`} style={{ aspectRatio: "16/9" }} />
                <div className="px-2 py-1.5 bg-card/80 backdrop-blur-sm">
                  <p className="text-xs font-medium text-center truncate">{bg.label}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
