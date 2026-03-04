"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BACKGROUNDS, TRANSITIONS, FONTS, SIZES, parseLyrics,
} from "@/lib/worship-constants";

export function usePresentation(presentationId: string | null) {
  const router = useRouter();

  /* ── Presentation data ── */
  const [presentationDbId, setPresentationDbId] = useState<string | null>(presentationId);
  const [title, setTitle]           = useState("");
  const [lyrics, setLyrics]         = useState("");
  const [bgId, setBgId]             = useState(BACKGROUNDS[0].id);
  const [transitionId, setTransId]  = useState(TRANSITIONS[0].id);
  const [fontId, setFontId]         = useState(FONTS[0].id);
  const [sizeId, setSizeId]         = useState(SIZES[1].id);

  /* ── Derived slide state ── */
  const [slides, setSlides]   = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  /* ── UI state ── */
  const [mode, setMode]             = useState<"editor" | "controller">("editor");
  const [isSaving, setIsSaving]     = useState(false);
  const [saved, setSaved]           = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isLoading, setIsLoading]   = useState(!!presentationId);

  /* ── Refs for BroadcastChannel sync (avoids stale closures) ── */
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

  /* ── Load existing presentation ── */
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

  /* ── Parse lyrics → slides ── */
  useEffect(() => {
    setSlides(parseLyrics(lyrics));
    setCurrent(0);
  }, [lyrics]);

  /* ── BroadcastChannel setup ── */
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

  /* ── Keyboard nav (controller mode only) ── */
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

  /* ── Auto-scroll active slide in list ── */
  useEffect(() => {
    if (mode === "controller") {
      activeSlideRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [current, mode]);

  /* ── Broadcast helper ── */
  const broadcast = useCallback(
    (idx: number, bg: string, tr: string, font: string, size: string) => {
      channelRef.current?.postMessage({
        type: "UPDATE",
        slide: slides[idx] ?? "", bg, transition: tr, font, size,
      });
    },
    [slides]
  );

  /* ── Navigation & style change handlers ── */
  const goTo = (idx: number) => {
    const c = Math.max(0, Math.min(idx, slides.length - 1));
    setCurrent(c);
    broadcast(c, bgId, transitionId, fontId, sizeId);
  };
  const changeBg   = (id: string) => { setBgId(id);   broadcast(current, id,  transitionId, fontId, sizeId); };
  const changeTr   = (id: string) => { setTransId(id); broadcast(current, bgId, id,          fontId, sizeId); };
  const changeFont = (id: string) => { setFontId(id);  broadcast(current, bgId, transitionId, id,    sizeId); };
  const changeSize = (id: string) => { setSizeId(id);  broadcast(current, bgId, transitionId, fontId, id   ); };

  /* ── Save ── */
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

  /* ── Presenter window ── */
  const openPresenter = async () => {
    setMode("controller");
    let features = `left=${window.screen.width},top=0,width=${window.screen.width},height=${window.screen.height}`;
    try {
      if ("getScreenDetails" in window) {
        const sd = await (window as unknown as { getScreenDetails(): Promise<{ screens: Array<{ isPrimary: boolean; availLeft: number; availTop: number; availWidth: number; availHeight: number }> }> }).getScreenDetails();
        const second = sd.screens.find((s) => !s.isPrimary);
        if (second) features = `left=${second.availLeft},top=${second.availTop},width=${second.availWidth},height=${second.availHeight}`;
      }
    } catch {}
    presenterRef.current = window.open("/worship/present", "worship-presenter", features);
  };

  const endPresentation = () => {
    channelRef.current?.postMessage({ type: "CLOSE" });
    setMode("editor");
  };

  /* ── Derived values ── */
  const bgCls         = BACKGROUNDS.find((b) => b.id === bgId)?.cls ?? "";
  const currentFamily = FONTS.find((f) => f.id === fontId)?.family ?? "'Inter', sans-serif";
  const currentSlide  = slides[current] ?? "";
  const nextSlide     = slides[current + 1] ?? "";

  return {
    /* state */
    title, setTitle,
    lyrics, setLyrics,
    slides, current,
    bgId, transitionId, fontId, sizeId,
    mode, setMode,
    isSaving, saved,
    titleError, setTitleError,
    isLoading,
    /* refs */
    activeSlideRef,
    /* derived */
    bgCls, currentFamily, currentSlide, nextSlide,
    /* actions */
    goTo, changeBg, changeTr, changeFont, changeSize,
    handleSave, openPresenter, endPresentation,
  };
}
