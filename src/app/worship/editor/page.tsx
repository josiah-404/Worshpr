"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tv2,
  MonitorOff,
  ArrowLeft,
  Save,
  Check,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import {
  BACKGROUNDS,
  TRANSITIONS,
  FONTS,
  SIZES,
  SPEEDS,
  PREVIEW_FONT_SIZES,
  CONTROLLER_FONT_SIZES,
} from "@/lib/worship-constants";
import { usePresentation } from "@/hooks/usePresentation";
import { SlidePreview } from "@/app/worship/components/SlidePreview";
import { BackgroundPicker } from "@/app/worship/components/BackgroundPicker";
import { SettingsDrawer } from "@/app/worship/components/SettingsDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Background thumbnail (renders bg at 1920px then scales down to avoid clipping) ── */
function BgThumb({
  bgCls,
  label,
  selected,
  onClick,
}: {
  bgCls: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [scale, setScale] = useState(0.1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) =>
      setScale(e.contentRect.width / 1920),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative rounded-md overflow-hidden transition-all ${selected ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"}`}
      style={{ aspectRatio: "16/5" }}
    >
      <div
        className={bgCls}
        style={{
          position: "absolute",
          width: "1920px",
          height: "1080px",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center",
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white drop-shadow-md"
        style={{ zIndex: 1 }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── Save button ── */
function SaveButton({
  onSave,
  isSaving,
  saved,
}: {
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}) {
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

/* ── Slide list ── */
function SlideList({
  slides,
  current,
  activeSlideRef,
  onGoTo,
}: {
  slides: string[];
  current: number;
  activeSlideRef: React.RefObject<HTMLButtonElement> | null;
  onGoTo: (i: number) => void;
}) {
  if (slides.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-2 py-3">No slides yet</p>
    );
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
          <span className="text-[10px] font-medium text-muted-foreground/50 mr-1.5">
            {i + 1}.
          </span>
          {slide.split("\n")[0]}
        </button>
      ))}
    </>
  );
}

/* ── Inner component ── */
function WorshipEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get("id");

  const [bgDialogOpen, setBgDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    title,
    setTitle,
    lyrics,
    setLyrics,
    slides,
    current,
    bgId,
    transitionId,
    fontId,
    sizeId,
    transSpeed,
    animSpeed,
    mode,
    setMode,
    isSaving,
    saved,
    titleError,
    setTitleError,
    isLoading,
    activeSlideRef,
    bgCls,
    currentFamily,
    currentSlide,
    nextSlide,
    goTo,
    changeBg,
    changeTr,
    changeFont,
    changeSize,
    changeTransSpeed,
    changeAnimSpeed,
    handleSave,
    openPresenter,
    endPresentation,
  } = usePresentation(presentationId);

  if (isLoading) return <EditorSkeleton />;

  /* ══════════════════════════════════════════════════════════════════
     CONTROLLER MODE
  ══════════════════════════════════════════════════════════════════ */
  if (mode === "controller") {
    return (
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode("editor")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Editor
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">
                {title || "Untitled"} — Slide{" "}
                {slides.length > 0 ? current + 1 : 0} of {slides.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={endPresentation}
              className="inline-flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <MonitorOff className="h-4 w-4" />
              End Presentation
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex gap-5 min-h-0 flex-1">
          {/* Left: Slide list + Up Next */}
          <div className="w-56 shrink-0 flex flex-col gap-3 min-h-0">
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest shrink-0">
              Slides
            </p>
            <div className="space-y-1 flex-1 overflow-y-auto pr-1 min-h-0">
              <SlideList
                slides={slides}
                current={current}
                activeSlideRef={activeSlideRef}
                onGoTo={goTo}
              />
            </div>
            {/* Up Next */}
            <div className="shrink-0 pb-1">
              <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                Up Next
              </p>
              <SlidePreview
                slide={nextSlide}
                bgCls={bgCls}
                fontFamily={currentFamily}
                fontSize={PREVIEW_FONT_SIZES[sizeId]}
                emptyText="End of slides"
              />
            </div>
          </div>

          {/* Right: Live preview with nav overlay */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              <span className="text-green-500">Live Now</span>
            </p>
            {/* Preview with Prev/Next overlaid */}
            <div className="relative flex-1 min-h-0">
              <SlidePreview
                slide={currentSlide}
                bgCls={bgCls}
                fontFamily={currentFamily}
                fontSize={CONTROLLER_FONT_SIZES[sizeId]}
                ringClass="ring-2 ring-green-500/25 h-full"
              />
              {/* Nav overlay */}
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-5 pointer-events-none">
                <button
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0}
                  className="pointer-events-auto flex items-center gap-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-black/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="text-xs text-white/40 bg-black/25 backdrop-blur-sm rounded-full px-3 py-1">
                  {slides.length > 0
                    ? `${current + 1} / ${slides.length}`
                    : "—"}
                </span>
                <button
                  onClick={() => goTo(current + 1)}
                  disabled={current >= slides.length - 1}
                  className="pointer-events-auto flex items-center gap-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-black/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <BackgroundPicker
          open={bgDialogOpen}
          selected={bgId}
          onSelect={changeBg}
          onClose={() => setBgDialogOpen(false)}
        />
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          bgId={bgId}
          transitionId={transitionId}
          fontId={fontId}
          sizeId={sizeId}
          transSpeed={transSpeed}
          animSpeed={animSpeed}
          mode={mode}
          onChangeBg={changeBg}
          onChangeTr={changeTr}
          onChangeFont={changeFont}
          onChangeSize={changeSize}
          onChangeTransSpeed={changeTransSpeed}
          onChangeAnimSpeed={changeAnimSpeed}
          onOpenBgPicker={() => setBgDialogOpen(true)}
          onOpenPresenter={openPresenter}
          onEndPresentation={endPresentation}
        />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     EDITOR MODE
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/worship")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            All Presentations
          </button>
          <span className="text-border shrink-0">|</span>
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(false);
              }}
              placeholder="Presentation title…"
              className={`w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40 border-b pb-0.5 transition-colors ${
                titleError
                  ? "border-destructive"
                  : "border-transparent focus:border-border"
              }`}
            />
            {titleError && (
              <p className="text-[10px] text-destructive mt-0.5">
                Title is required to save
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SaveButton onSave={handleSave} isSaving={isSaving} saved={saved} />
          <button
            onClick={openPresenter}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            <Tv2 className="h-4 w-4" />
            Open Presenter
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── Panel 1: Slides list ── */}
        <div className="w-52 shrink-0 flex flex-col gap-3 min-h-0">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest shrink-0">
            Slides{" "}
            {slides.length > 0 && (
              <span className="text-muted-foreground/40">
                ({slides.length})
              </span>
            )}
          </p>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {slides.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 px-2 py-2 leading-relaxed">
                Paste lyrics in the editor to generate slides
              </p>
            ) : (
              <SlideList
                slides={slides}
                current={current}
                activeSlideRef={activeSlideRef}
                onGoTo={goTo}
              />
            )}
          </div>
        </div>

        {/* ── Panel 2: Lyrics editor ── */}
        <div className="w-96 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm font-medium">Song Lyrics</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Separate slides with a blank line
              </p>
            </div>
          </div>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={
              "Amazing grace, how sweet the sound\nThat saved a wretch like me\n\nI once was lost, but now I'm found\nWas blind but now I see"
            }
            className="flex-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono leading-relaxed min-h-[320px]"
          />
        </div>

        {/* ── Panel 3: Preview + controls ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto min-h-0">
          {/* Preview */}
          <div className="space-y-1.5 shrink-0">
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              Preview
            </p>
            <SlidePreview
              slide={currentSlide}
              bgCls={`rounded-lg ${bgCls}`}
              fontFamily={currentFamily}
              fontSize={PREVIEW_FONT_SIZES[sizeId]}
              emptyText="Paste lyrics to preview"
            />
            {slides.length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <span className="text-[11px] text-muted-foreground">
                  {current + 1} / {slides.length}
                </span>
                <button
                  onClick={() => goTo(current + 1)}
                  disabled={current === slides.length - 1}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Background */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                Background
              </p>
              <button
                onClick={() => setBgDialogOpen(true)}
                className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <LayoutGrid className="h-2.5 w-2.5" />
                See all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1">
              {BACKGROUNDS.slice(0, 6).map((bg) => (
                <BgThumb
                  key={bg.id}
                  bgCls={bg.cls}
                  label={bg.label}
                  selected={bgId === bg.id}
                  onClick={() => changeBg(bg.id)}
                />
              ))}
            </div>
          </div>

          {/* Transition */}
          <div className="space-y-2 shrink-0">
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              Transition
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {TRANSITIONS.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => changeTr(tr.id)}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
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

          {/* Transition Speed + Animation Speed */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                Transition Speed
              </p>
              <div className="flex flex-col gap-1.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeTransSpeed(s.id)}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                      transSpeed === s.id
                        ? "bg-indigo-500 text-white"
                        : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                Animation Speed
              </p>
              <div className="flex flex-col gap-1.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeAnimSpeed(s.id)}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                      animSpeed === s.id
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

          {/* Font + Text Size */}
          <div className="grid grid-cols-2 gap-4 shrink-0 pb-4">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                Font
              </p>
              <Select value={fontId} onValueChange={changeFont}>
                <SelectTrigger
                  className="w-full"
                  style={{
                    fontFamily: FONTS.find((f) => f.id === fontId)?.family,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      style={{ fontFamily: f.family }}
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                Text Size
              </p>
              <Select value={sizeId} onValueChange={changeSize}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <BackgroundPicker
        open={bgDialogOpen}
        selected={bgId}
        onSelect={changeBg}
        onClose={() => setBgDialogOpen(false)}
      />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-px" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
      <div className="flex gap-5 flex-1 min-h-0">
        <div className="w-52 shrink-0 flex flex-col gap-3">
          <Skeleton className="h-3 w-12" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-xl"
              style={{ aspectRatio: "16/9" }}
            />
          ))}
        </div>
        <div className="w-96 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton
            className="flex-1 rounded-xl"
            style={{ minHeight: "400px" }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton
              className="w-full rounded-xl"
              style={{ aspectRatio: "16/9" }}
            />
            <div className="flex items-center justify-between pt-0.5">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="grid grid-cols-3 gap-1.5 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="rounded-md"
                  style={{ aspectRatio: "16/5" }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-md" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 rounded-md" />
                ))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorshipEditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <WorshipEditorInner />
    </Suspense>
  );
}
