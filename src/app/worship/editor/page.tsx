"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink, ChevronLeft, ChevronRight,
  Tv2, MonitorOff, ArrowLeft, Save, Check, LayoutGrid, X,
} from "lucide-react";
import { BACKGROUNDS } from "@/lib/worship-constants";
const TRANSITIONS = [
  { id: "fade", label: "Fade"     },
  { id: "up",   label: "Slide Up" },
  { id: "zoom", label: "Zoom"     },
  { id: "blur", label: "Blur In"  },
];
const FONTS = [
  { id: "inter",      label: "Inter",      family: "'Inter', sans-serif"         },
  { id: "playfair",   label: "Playfair",   family: "'Playfair Display', serif"   },
  { id: "montserrat", label: "Montserrat", family: "'Montserrat', sans-serif"    },
  { id: "cormorant",  label: "Cormorant",  family: "'Cormorant Garamond', serif" },
];
const SIZES = [
  { id: "sm", label: "S"  },
  { id: "md", label: "M"  },
  { id: "lg", label: "L"  },
  { id: "xl", label: "XL" },
];
const PREVIEW_FONT_SIZES: Record<string, string> = {
  sm: "clamp(0.6rem, 1.4vw, 1.1rem)",
  md: "clamp(0.75rem, 1.8vw, 1.4rem)",
  lg: "clamp(0.95rem, 2.3vw, 1.8rem)",
  xl: "clamp(1.2rem,  3vw,   2.3rem)",
};
const CONTROLLER_FONT_SIZES: Record<string, string> = {
  sm: "clamp(0.9rem, 2vw,  1.8rem)",
  md: "clamp(1.2rem, 2.5vw, 2.2rem)",
  lg: "clamp(1.5rem, 3vw,  2.8rem)",
  xl: "clamp(1.9rem, 3.8vw, 3.5rem)",
};

function parseLyrics(text: string): string[] {
  return text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
}

/* ── Inner component (needs useSearchParams → must be inside Suspense) ── */
function WorshipEditorInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get("id");

  /* State */
  const [presentationDbId, setPresentationDbId] = useState<string | null>(presentationId);
  const [title, setTitle]          = useState("");
  const [lyrics, setLyrics]        = useState("");
  const [slides, setSlides]        = useState<string[]>([]);
  const [current, setCurrent]      = useState(0);
  const [bgId, setBgId]            = useState(BACKGROUNDS[0].id);
  const [transitionId, setTransId] = useState(TRANSITIONS[0].id);
  const [fontId, setFontId]        = useState(FONTS[0].id);
  const [sizeId, setSizeId]        = useState(SIZES[1].id);
  const [mode, setMode]            = useState<"editor" | "controller">("editor");
  const [isSaving, setIsSaving]    = useState(false);
  const [saved, setSaved]          = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isLoading, setIsLoading]  = useState(!!presentationId);
  const [bgDialogOpen, setBgDialogOpen] = useState(false);

  /* Refs */
  const channelRef     = useRef<BroadcastChannel | null>(null);
  const presenterRef   = useRef<Window | null>(null);
  const activeSlideRef = useRef<HTMLButtonElement | null>(null);
  const slidesRef      = useRef(slides);
  const currentRef     = useRef(current);
  const bgIdRef        = useRef(bgId);
  const transRef       = useRef(transitionId);
  const fontRef        = useRef(fontId);
  const sizeRef        = useRef(sizeId);
  const modeRef        = useRef(mode);
  useEffect(() => { slidesRef.current  = slides;       }, [slides]);
  useEffect(() => { currentRef.current = current;      }, [current]);
  useEffect(() => { bgIdRef.current    = bgId;         }, [bgId]);
  useEffect(() => { transRef.current   = transitionId; }, [transitionId]);
  useEffect(() => { fontRef.current    = fontId;       }, [fontId]);
  useEffect(() => { sizeRef.current    = sizeId;       }, [sizeId]);
  useEffect(() => { modeRef.current    = mode;         }, [mode]);

  /* Load existing presentation */
  useEffect(() => {
    if (!presentationId) return;
    fetch(`/api/presentations/${presentationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setTitle(data.title);
        setLyrics(data.lyrics);
        setBgId(data.bgId);
        setTransId(data.transitionId);
        setFontId(data.fontId);
        setSizeId(data.sizeId);
      })
      .finally(() => setIsLoading(false));
  }, [presentationId]);

  /* Parse lyrics → slides */
  useEffect(() => {
    setSlides(parseLyrics(lyrics));
    setCurrent(0);
  }, [lyrics]);

  /* BroadcastChannel */
  useEffect(() => {
    const ch = new BroadcastChannel("worship-presenter");
    channelRef.current = ch;
    ch.onmessage = (e) => {
      if (e.data?.type === "REQUEST_STATE") {
        ch.postMessage({
          type: "UPDATE",
          slide:      slidesRef.current[currentRef.current] ?? "",
          bg:         bgIdRef.current,
          transition: transRef.current,
          font:       fontRef.current,
          size:       sizeRef.current,
        });
      }
    };
    return () => ch.close();
  }, []);

  /* Keyboard nav in controller mode */
  const goToRef = useRef<(idx: number) => void>(() => {});
  useEffect(() => {
    goToRef.current = (idx: number) => {
      const c = Math.max(0, Math.min(idx, slidesRef.current.length - 1));
      setCurrent(c);
      channelRef.current?.postMessage({
        type: "UPDATE",
        slide:      slidesRef.current[c] ?? "",
        bg:         bgIdRef.current,
        transition: transRef.current,
        font:       fontRef.current,
        size:       sizeRef.current,
      });
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modeRef.current !== "controller") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault(); goToRef.current(currentRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault(); goToRef.current(currentRef.current - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Auto-scroll active slide */
  useEffect(() => {
    if (mode === "controller") {
      activeSlideRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [current, mode]);

  /* Broadcast */
  const broadcast = useCallback(
    (idx: number, bg: string, tr: string, font: string, size: string) => {
      channelRef.current?.postMessage({
        type: "UPDATE",
        slide: slides[idx] ?? "", bg, transition: tr, font, size,
      });
    },
    [slides]
  );

  const goTo       = (idx: number) => { const c = Math.max(0, Math.min(idx, slides.length - 1)); setCurrent(c); broadcast(c, bgId, transitionId, fontId, sizeId); };
  const changeBg   = (id: string)  => { setBgId(id);    broadcast(current, id,  transitionId, fontId, sizeId); };
  const changeTr   = (id: string)  => { setTransId(id); broadcast(current, bgId, id,          fontId, sizeId); };
  const changeFont = (id: string)  => { setFontId(id);  broadcast(current, bgId, transitionId, id,    sizeId); };
  const changeSize = (id: string)  => { setSizeId(id);  broadcast(current, bgId, transitionId, fontId, id   ); };

  /* Save */
  const handleSave = async () => {
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
    setIsSaving(true);

    const body = { title, lyrics, bgId, transitionId, fontId, sizeId };

    if (presentationDbId) {
      await fetch(`/api/presentations/${presentationDbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      const res  = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id) {
        setPresentationDbId(data.id);
        router.replace(`/worship/editor?id=${data.id}`);
      }
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* Open presenter */
  const openPresenter = async () => {
    setMode("controller");
    let features = `left=${window.screen.width},top=0,width=${window.screen.width},height=${window.screen.height}`;
    try {
      if ("getScreenDetails" in window) {
        const sd = await (window as any).getScreenDetails();
        const second = sd.screens.find((s: any) => !s.isPrimary);
        if (second) features = `left=${second.availLeft},top=${second.availTop},width=${second.availWidth},height=${second.availHeight}`;
      }
    } catch {}
    presenterRef.current = window.open("/worship/present", "worship-presenter", features);
  };

  const endPresentation = () => {
    channelRef.current?.postMessage({ type: "CLOSE" });
    setMode("editor");
  };

  /* Derived */
  const currentSlide  = slides[current] ?? "";
  const nextSlide     = slides[current + 1] ?? "";
  const bgCls         = BACKGROUNDS.find((b) => b.id === bgId)?.cls ?? "";
  const currentFamily = FONTS.find((f) => f.id === fontId)?.family ?? "'Inter', sans-serif";

  /* ── Save button ── */
  const SaveButton = () => (
    <button
      onClick={handleSave}
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

  /* ── Compact toolbar ── */
  const Toolbar = () => (
    <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">BG</span>
        <div className="flex gap-1">
          {[
            BACKGROUNDS.find((b) => b.id === bgId)!,
            ...BACKGROUNDS.filter((b) => b.id !== bgId).slice(0, 3),
          ].map((bg) => (
            <button key={bg.id} onClick={() => changeBg(bg.id)}
              className={`relative h-6 w-14 rounded overflow-hidden transition-all ${bg.cls} ${bgId === bg.id ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-background" : "opacity-55 hover:opacity-100"}`}>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">{bg.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setBgDialogOpen(true)}
          className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
          <LayoutGrid className="h-2.5 w-2.5" />more
        </button>
      </div>
      <span className="text-border text-xs">|</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Transition</span>
        <div className="flex gap-1">
          {TRANSITIONS.map((tr) => (
            <button key={tr.id} onClick={() => changeTr(tr.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${transitionId === tr.id ? "bg-indigo-500 text-white" : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
              {tr.label}
            </button>
          ))}
        </div>
      </div>
      <span className="text-border text-xs">|</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Font</span>
        <div className="flex gap-1">
          {FONTS.map((f) => (
            <button key={f.id} onClick={() => changeFont(f.id)} style={{ fontFamily: f.family }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${fontId === f.id ? "bg-indigo-500 text-white" : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <span className="text-border text-xs">|</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Size</span>
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button key={s.id} onClick={() => changeSize(s.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${sizeId === s.id ? "bg-indigo-500 text-white" : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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
            <button onClick={() => setMode("editor")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <SaveButton />
            <button onClick={endPresentation}
              className="inline-flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors">
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
              {slides.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3">No slides yet</p>
              ) : slides.map((slide, i) => (
                <button key={i} ref={i === current ? activeSlideRef : null} onClick={() => goTo(i)}
                  className={`w-full text-left rounded-md px-3 py-2 text-xs leading-snug transition-colors ${i === current ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground" : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                  <span className="text-[10px] font-medium text-muted-foreground/50 mr-1.5">{i + 1}.</span>
                  {slide.split("\n")[0]}
                </button>
              ))}
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
              <div className={`relative w-full rounded-xl overflow-hidden ring-2 ring-green-500/25 ${bgCls}`} style={{ aspectRatio: "16/9" }}>
                <div className="absolute inset-0 flex items-center justify-center px-10">
                  {currentSlide ? (
                    <p className="text-white text-center font-bold leading-tight drop-shadow-2xl whitespace-pre-line"
                      style={{ fontFamily: currentFamily, fontSize: CONTROLLER_FONT_SIZES[sizeId], textShadow: "0 2px 20px rgba(0,0,0,0.85)" }}>
                      {currentSlide}
                    </p>
                  ) : (
                    <p className="text-white/25 text-sm">No slide selected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Up next + nav */}
            <div className="flex items-end gap-4">
              <div className="w-44 shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground/55 uppercase tracking-widest mb-1.5">Up Next</p>
                <div className={`relative w-full rounded-lg overflow-hidden opacity-55 ${bgCls}`} style={{ aspectRatio: "16/9" }}>
                  <div className="absolute inset-0 flex items-center justify-center px-3">
                    {nextSlide ? (
                      <p className="text-white text-center font-bold leading-tight drop-shadow whitespace-pre-line"
                        style={{ fontFamily: currentFamily, fontSize: "0.48rem" }}>
                        {nextSlide}
                      </p>
                    ) : (
                      <p className="text-white/30 text-[8px] text-center">End of slides</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <button onClick={() => goTo(current - 1)} disabled={current === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-5 w-5" />Prev
                </button>
                <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
                  {slides.length > 0 ? `${current + 1} / ${slides.length}` : "—"}
                </span>
                <button onClick={() => goTo(current + 1)} disabled={current >= slides.length - 1}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                  Next<ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <Toolbar />
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
          <button onClick={() => router.push("/worship")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />All Presentations
          </button>
          <span className="text-border shrink-0">|</span>
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
              placeholder="Presentation title…"
              className={`w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40 border-b pb-0.5 transition-colors ${titleError ? "border-destructive" : "border-transparent focus:border-border"}`}
            />
            {titleError && <p className="text-[10px] text-destructive mt-0.5">Title is required to save</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SaveButton />
          <button onClick={openPresenter}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors">
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
                {slides.map((slide, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`w-full text-left rounded-md px-3 py-2 text-xs leading-snug transition-colors ${i === current ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground" : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                    <span className="text-[10px] font-medium text-muted-foreground/60 mr-1.5">{i + 1}.</span>
                    {slide.split("\n")[0]}
                  </button>
                ))}
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
                <LayoutGrid className="h-3 w-3" />
                See more
              </button>
            </div>
            {/* Show selected bg first, then fill with featured ones */}
            <div className="grid grid-cols-2 gap-2">
              {[
                BACKGROUNDS.find((b) => b.id === bgId)!,
                ...BACKGROUNDS.filter((b) => b.id !== bgId).slice(0, 3),
              ].map((bg) => (
                <button key={bg.id} onClick={() => changeBg(bg.id)}
                  className={`relative h-12 rounded-md overflow-hidden transition-all ${bg.cls} ${bgId === bg.id ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"}`}>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Transition</label>
            <div className="flex gap-1.5">
              {TRANSITIONS.map((tr) => (
                <button key={tr.id} onClick={() => changeTr(tr.id)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${transitionId === tr.id ? "bg-indigo-500 text-white" : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
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
                  <button key={f.id} onClick={() => changeFont(f.id)} style={{ fontFamily: f.family }}
                    className={`w-full rounded-md px-3 py-1.5 text-sm text-left transition-colors ${fontId === f.id ? "bg-indigo-500/15 border border-indigo-500/30 text-foreground" : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Size</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SIZES.map((s) => (
                  <button key={s.id} onClick={() => changeSize(s.id)}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${sizeId === s.id ? "bg-indigo-500 text-white" : "border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className={`relative w-full rounded-lg overflow-hidden ${bgCls}`} style={{ aspectRatio: "16/9" }}>
              {slides.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/40 text-sm text-center px-4">Paste lyrics to see a preview</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-6">
                  <p className="text-white text-center font-bold leading-snug drop-shadow-lg whitespace-pre-line"
                    style={{ fontFamily: currentFamily, fontSize: PREVIEW_FONT_SIZES[sizeId] }}>
                    {currentSlide}
                  </p>
                </div>
              )}
            </div>
          </div>

          {slides.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => goTo(current - 1)} disabled={current === 0}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />Prev
              </button>
              <span className="text-xs text-muted-foreground">Slide {current + 1} / {slides.length}</span>
              <button onClick={() => goTo(current + 1)} disabled={current === slides.length - 1}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Background picker dialog ── */}
      {bgDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBgDialogOpen(false)}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold">Choose Background</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {BACKGROUNDS.length} animated backgrounds available
                </p>
              </div>
              <button
                onClick={() => setBgDialogOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Grid */}
            <div className="p-5 grid grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto">
              {BACKGROUNDS.map((bg) => {
                const isSelected = bgId === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => { changeBg(bg.id); setBgDialogOpen(false); }}
                    className={`group relative rounded-lg overflow-hidden transition-all focus:outline-none ${
                      isSelected
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-card"
                        : "opacity-75 hover:opacity-100 hover:ring-1 hover:ring-white/20"
                    }`}
                  >
                    {/* 16:9 thumbnail */}
                    <div className={`w-full ${bg.cls}`} style={{ aspectRatio: "16/9" }} />
                    {/* Label */}
                    <div className="px-2 py-1.5 bg-card/80 backdrop-blur-sm">
                      <p className="text-xs font-medium text-center truncate">{bg.label}</p>
                    </div>
                    {/* Selected tick */}
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
      )}
    </div>
  );
}

/* ── Page export — wraps inner component in Suspense for useSearchParams ── */
// (BgPickerDialog is rendered inside WorshipEditorInner via bgDialogOpen state)

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
