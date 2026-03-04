"use client";

import { LayoutGrid, X, Tv2, MonitorOff, SlidersHorizontal } from "lucide-react";
import { BACKGROUNDS, TRANSITIONS, FONTS, SIZES, SPEEDS } from "@/lib/worship-constants";

interface SettingsDrawerProps {
  open:    boolean;
  onClose: () => void;
  bgId:         string;
  transitionId: string;
  fontId:       string;
  sizeId:       string;
  transSpeed:   string;
  animSpeed:    string;
  mode:         "editor" | "controller";
  onChangeBg:         (id: string) => void;
  onChangeTr:         (id: string) => void;
  onChangeFont:       (id: string) => void;
  onChangeSize:       (id: string) => void;
  onChangeTransSpeed: (id: string) => void;
  onChangeAnimSpeed:  (id: string) => void;
  onOpenBgPicker:     () => void;
  onOpenPresenter:    () => void;
  onEndPresentation:  () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

export function SettingsDrawer({
  open, onClose,
  bgId, transitionId, fontId, sizeId, transSpeed, animSpeed,
  mode,
  onChangeBg, onChangeTr, onChangeFont, onChangeSize,
  onChangeTransSpeed, onChangeAnimSpeed,
  onOpenBgPicker, onOpenPresenter, onEndPresentation,
}: SettingsDrawerProps) {
  const activeBg    = BACKGROUNDS.find((b) => b.id === bgId)!;
  const featuredBgs = [activeBg, ...BACKGROUNDS.filter((b) => b.id !== bgId).slice(0, 3)];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full z-50 w-80 bg-card border-l border-border flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold">Presentation Settings</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* ── Live Presentation ── */}
          <section>
            <SectionLabel>Live Presentation</SectionLabel>
            {mode === "editor" ? (
              <button
                onClick={() => { onOpenPresenter(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
              >
                <Tv2 className="h-4 w-4" />Open Presenter
              </button>
            ) : (
              <button
                onClick={() => { onEndPresentation(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
              >
                <MonitorOff className="h-4 w-4" />End Presentation
              </button>
            )}
          </section>

          {/* ── Background ── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Background</SectionLabel>
              <button
                onClick={() => { onOpenBgPicker(); onClose(); }}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors -mt-2"
              >
                <LayoutGrid className="h-2.5 w-2.5" />See all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {featuredBgs.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onChangeBg(bg.id)}
                  className={`relative h-10 rounded-md overflow-hidden transition-all ${bg.cls} ${
                    bgId === bg.id
                      ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-card"
                      : "opacity-55 hover:opacity-100"
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Transition Effect ── */}
          <section>
            <SectionLabel>Transition Effect</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {TRANSITIONS.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => onChangeTr(tr.id)}
                  className={`rounded-md py-2 text-xs font-medium transition-colors ${
                    transitionId === tr.id
                      ? "bg-indigo-500 text-white"
                      : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Transition Speed ── */}
          <section>
            <SectionLabel>Transition Speed</SectionLabel>
            <div className="flex gap-1.5">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChangeTransSpeed(s.id)}
                  className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                    transSpeed === s.id
                      ? "bg-indigo-500 text-white"
                      : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Animation Speed ── */}
          <section>
            <SectionLabel>Animation Speed</SectionLabel>
            <div className="flex gap-1.5">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChangeAnimSpeed(s.id)}
                  className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                    animSpeed === s.id
                      ? "bg-indigo-500 text-white"
                      : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Font ── */}
          <section>
            <SectionLabel>Font</SectionLabel>
            <div className="space-y-1">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChangeFont(f.id)}
                  style={{ fontFamily: f.family }}
                  className={`w-full rounded-md px-3 py-2 text-sm text-left transition-colors ${
                    fontId === f.id
                      ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground"
                      : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Size ── */}
          <section>
            <SectionLabel>Text Size</SectionLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChangeSize(s.id)}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                    sizeId === s.id
                      ? "bg-indigo-500 text-white"
                      : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
