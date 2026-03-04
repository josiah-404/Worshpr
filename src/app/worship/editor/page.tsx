"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink, ChevronLeft, ChevronRight,
  Tv2, MonitorOff, ArrowLeft, Save, Check, LayoutGrid,
} from "lucide-react";
import { BACKGROUNDS, TRANSITIONS, FONTS, SIZES, PREVIEW_FONT_SIZES, CONTROLLER_FONT_SIZES } from "@/lib/worship-constants";
import { usePresentation } from "@/hooks/usePresentation";
import { SlidePreview }     from "@/app/worship/components/SlidePreview";
import { BackgroundPicker } from "@/app/worship/components/BackgroundPicker";
import { OptionsToolbar }   from "@/app/worship/components/OptionsToolbar";

/* ── Save button ── */
function SaveButton({ onSave, isSaving, saved }: { onSave: () => void; isSaving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        saved
          ? "bg-green-500/15 border border-green-500/30 text-green-500"
          : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {saved ? "Saved" : isSaving ? "Saving…" : "Save"}
    </button>
  );
}

/* ── Slide list (reused in editor + controller) ── */
function SlideList({
  slides, current, activeSlideRef, onGoTo,
}: {
  slides: string[];
  current: number;
  activeSlideRef: React.RefObject<HTMLButtonElement | null>;
  onGoTo: (i: number) => void;
}) {
  if (slides.length === 0) {
    return <p className="text-xs text-muted-foreground px-2 py-3">No slides yet</p>;
  }
  return (
    <>
      {slides.map((slide, i) => (
        <button
          key={i}
          ref={i === current ? activeSlideRef : null}
          onClick={() => onGoTo(i)}
          className={`w-full text-left rounded-md px-3 py-2 text-xs leading-snug transition-colors ${
            i === current
              ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground"
              : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
        >
          <span className="text-[10px] font-medium text-muted-foreground/50 mr-1.5">{i + 1}.</span>
          {slide.split("\n")[0]}
        </button>
      ))}
    </>
  );
}

/* ── Inner component (needs useSearchParams → must be inside Suspense) ── */
function WorshipEditorInner() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const presentationId = searchParams.get("id");

  const [bgDialogOpen, setBgDialogOpen] = useState(false);

  const {
    title, setTitle,
    lyrics, setLyrics,
    slides, current,
    bgId, transitionId, fontId, sizeId,
    mode, setMode,
    isSaving, saved,
    titleError, setTitleError,
    isLoading,
    activeSlideRef,
    bgCls, currentFamily, currentSlide, nextSlide,
    goTo, changeBg, changeTr, changeFont, changeSize,
    handleSave, openPresenter, endPresentation,
  } = usePresentation(presentationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-muted-foreground">Loading presentation…</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     CONTROLLER MODE
  ══════════════════════════════════════════════════════════════════ */
  if (mode === "controller") {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode("editor")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />Editor
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">
                {title || "Untitled"} — Slide {slides.length > 0 ? current + 1 : 0} of {slides.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SaveButton onSave={handleSave} isSaving={isSaving} saved={saved} />
            <button
              onClick={endPresentation}
              className="inline-flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <MonitorOff className="h-4 w-4" />End Presentation
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex gap-5 min-h-0">
          {/* Slide list */}
          <div className="w-56 shrink-0 flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">Slides</p>
            <div className="space-y-1 max-h-[62vh] overflow-y-auto pr-1">
              <SlideList slides={slides} current={current} activeSlideRef={activeSlideRef} onGoTo={goTo} />
            </div>
          </div>

          {/* Right */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Live preview */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                <span className="text-green-500">Live Now</span>
              </p>
              <SlidePreview
                slide={currentSlide}
                bgCls={bgCls}
                fontFamily={currentFamily}
                fontSize={CONTROLLER_FONT_SIZES[sizeId]}
                ringClass="ring-2 ring-green-500/25"
              />
            </div>

            {/* Up next + nav */}
            <div className="flex items-end gap-4">
              <div className="w-44 shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground/55 uppercase tracking-widest mb-1.5">Up Next</p>
                <div className={`relative w-full rounded-lg overflow-hidden opacity-55 ${bgCls}`} style={{ aspectRatio: "16/9" }}>
                  <div className="absolute inset-0 flex items-center justify-center px-3">
                    {nextSlide ? (
                      <p
                        className="text-white text-center font-bold leading-tight drop-shadow whitespace-pre-line"
                        style={{ fontFamily: currentFamily, fontSize: "0.48rem" }}
                      >
                        {nextSlide}
                      </p>
                    ) : (
                      <p className="text-white/30 text-[8px] text-center">End of slides</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />Prev
                </button>
                <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
                  {slides.length > 0 ? `${current + 1} / ${slides.length}` : "—"}
                </span>
                <button
                  onClick={() => goTo(current + 1)}
                  disabled={current >= slides.length - 1}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  Next<ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <OptionsToolbar
          bgId={bgId} transitionId={transitionId} fontId={fontId} sizeId={sizeId}
          onChangeBg={changeBg} onChangeTr={changeTr} onChangeFont={changeFont} onChangeSize={changeSize}
          onOpenBgPicker={() => setBgDialogOpen(true)}
        />
        <BackgroundPicker open={bgDialogOpen} selected={bgId} onSelect={changeBg} onClose={() => setBgDialogOpen(false)} />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     EDITOR MODE
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/worship")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />All Presentations
          </button>
          <span className="text-border shrink-0">|</span>
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
              placeholder="Presentation title…"
              className={`w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40 border-b pb-0.5 transition-colors ${
                titleError ? "border-destructive" : "border-transparent focus:border-border"
              }`}
            />
            {titleError && <p className="text-[10px] text-destructive mt-0.5">Title is required to save</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SaveButton onSave={handleSave} isSaving={isSaving} saved={saved} />
          <button
            onClick={openPresenter}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            <Tv2 className="h-4 w-4" />Open Presenter
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Lyrics */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Song Lyrics</label>
          <p className="text-xs text-muted-foreground -mt-1">Separate slides with a blank line</p>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={"Amazing grace, how sweet the sound\nThat saved a wretch like me\n\nI once was lost, but now I'm found\nWas blind but now I see"}
            className="w-full h-72 rounded-md border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono leading-relaxed"
          />
          {slides.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slides ({slides.length})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <SlideList slides={slides} current={current} activeSlideRef={activeSlideRef} onGoTo={goTo} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls + Preview */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Background</label>
              <button
                onClick={() => setBgDialogOpen(true)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <LayoutGrid className="h-3 w-3" />See more
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                BACKGROUNDS.find((b) => b.id === bgId)!,
                ...BACKGROUNDS.filter((b) => b.id !== bgId).slice(0, 3),
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => changeBg(bg.id)}
                  className={`relative h-12 rounded-md overflow-hidden transition-all ${bg.cls} ${
                    bgId === bg.id
                      ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Transition</label>
            <div className="flex gap-1.5">
              {TRANSITIONS.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => changeTr(tr.id)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    transitionId === tr.id
                      ? "bg-indigo-500 text-white"
                      : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Font</label>
              <div className="space-y-1">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => changeFont(f.id)}
                    style={{ fontFamily: f.family }}
                    className={`w-full rounded-md px-3 py-1.5 text-sm text-left transition-colors ${
                      fontId === f.id
                        ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground"
                        : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Size</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeSize(s.id)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      sizeId === s.id
                        ? "bg-indigo-500 text-white"
                        : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <SlidePreview
              slide={currentSlide}
              bgCls={`rounded-lg ${bgCls}`}
              fontFamily={currentFamily}
              fontSize={PREVIEW_FONT_SIZES[sizeId]}
              emptyText="Paste lyrics to see a preview"
            />
          </div>

          {slides.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />Prev
              </button>
              <span className="text-xs text-muted-foreground">Slide {current + 1} / {slides.length}</span>
              <button
                onClick={() => goTo(current + 1)}
                disabled={current === slides.length - 1}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <OptionsToolbar
        bgId={bgId} transitionId={transitionId} fontId={fontId} sizeId={sizeId}
        onChangeBg={changeBg} onChangeTr={changeTr} onChangeFont={changeFont} onChangeSize={changeSize}
        onOpenBgPicker={() => setBgDialogOpen(true)}
      />

      <BackgroundPicker open={bgDialogOpen} selected={bgId} onSelect={changeBg} onClose={() => setBgDialogOpen(false)} />
    </div>
  );
}

export default function WorshipEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    }>
      <WorshipEditorInner />
    </Suspense>
  );
}
