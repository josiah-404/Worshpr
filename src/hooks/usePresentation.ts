"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import {
  BACKGROUNDS,
  TRANSITIONS,
  FONTS,
  SIZES,
  SPEEDS,
  parseLyrics,
} from '@/lib/constants';
import type { Presentation } from '@/types';
import type { SongResult } from '@/types/worship.types';

export function usePresentation(presentationId: string | null) {
  const router = useRouter();

  /* ── Presentation data ── */
  const [presentationDbId, setPresentationDbId] = useState<string | null>(
    presentationId,
  );
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [initialQueue, setInitialQueue] = useState<SongResult[]>([]);
  const [bgId, setBgId] = useState<string>(BACKGROUNDS[0].id);
  const [transitionId, setTransId] = useState<string>(TRANSITIONS[0].id);
  const [fontId, setFontId] = useState<string>(FONTS[0].id);
  const [sizeId, setSizeId] = useState<string>(SIZES[1].id);
  const [transSpeed, setTransSpeed] = useState<string>(SPEEDS[1].id);
  const [animSpeed, setAnimSpeed] = useState<string>(SPEEDS[1].id);

  /* ── Derived slide state ── */
  const [slides, setSlides] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  /* ── UI state ── */
  const [mode, setMode] = useState<"editor" | "controller">("editor");
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!presentationId);

  /* ── Refs for BroadcastChannel sync (avoids stale closures) ── */
  const channelRef = useRef<BroadcastChannel | null>(null);
  const presenterRef = useRef<Window | null>(null);
  const activeSlideRef = useRef<HTMLButtonElement>(null!);
  const slidesRef = useRef(slides);
  const currentRef = useRef(current);
  const bgIdRef = useRef(bgId);
  const transRef = useRef(transitionId);
  const fontRef = useRef(fontId);
  const sizeRef = useRef(sizeId);
  const transSpeedRef = useRef(transSpeed);
  const animSpeedRef = useRef(animSpeed);
  const modeRef = useRef(mode);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    bgIdRef.current = bgId;
  }, [bgId]);
  useEffect(() => {
    transRef.current = transitionId;
  }, [transitionId]);
  useEffect(() => {
    fontRef.current = fontId;
  }, [fontId]);
  useEffect(() => {
    sizeRef.current = sizeId;
  }, [sizeId]);
  useEffect(() => {
    transSpeedRef.current = transSpeed;
  }, [transSpeed]);
  useEffect(() => {
    animSpeedRef.current = animSpeed;
  }, [animSpeed]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /* ── Load existing presentation ── */
  useEffect(() => {
    if (!presentationId) return;
    setCurrent(0); // Reset to slide 1 when loading a different presentation
    api
      .get<{ data: Presentation }>(`/presentations/${presentationId}`)
      .then(({ data: res }) => {
        const p = res.data;
        setTitle(p.title);
        setLyrics(p.lyrics);
        setInitialQueue(Array.isArray(p.songQueue) ? p.songQueue : []);
        setBgId(p.bgId);
        setTransId(p.transitionId);
        setFontId(p.fontId);
        setSizeId(p.sizeId);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [presentationId]);

  /* ── Parse lyrics → slides ── */
  useEffect(() => {
    setSlides(parseLyrics(lyrics));
    // Do NOT reset current here — that would jump to slide 1 on every keystroke.
  }, [lyrics]);

  /* ── Keep current in bounds when the slides array shrinks ── */
  useEffect(() => {
    if (slides.length > 0) {
      setCurrent((c) => Math.min(c, slides.length - 1));
    }
  }, [slides]);

  /* ── Live-edit sync: broadcast current slide whenever lyrics are re-parsed ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      channelRef.current?.postMessage({
        type: "UPDATE",
        slide: slides[currentRef.current] ?? "",
        bg: bgIdRef.current,
        transition: transRef.current,
        font: fontRef.current,
        size: sizeRef.current,
        transSpeed: transSpeedRef.current,
        animSpeed: animSpeedRef.current,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [slides]);

  /* ── BroadcastChannel setup ── */
  useEffect(() => {
    const ch = new BroadcastChannel("worship-presenter");
    channelRef.current = ch;
    ch.onmessage = (e) => {
      if (e.data?.type === "REQUEST_STATE") {
        ch.postMessage({
          type: "UPDATE",
          slide: slidesRef.current[currentRef.current] ?? "",
          bg: bgIdRef.current,
          transition: transRef.current,
          font: fontRef.current,
          size: sizeRef.current,
          transSpeed: transSpeedRef.current,
          animSpeed: animSpeedRef.current,
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
        slide: slidesRef.current[c] ?? "",
        bg: bgIdRef.current,
        transition: transRef.current,
        font: fontRef.current,
        size: sizeRef.current,
        transSpeed: transSpeedRef.current,
        animSpeed: animSpeedRef.current,
      });
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modeRef.current !== "controller") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        goToRef.current(currentRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToRef.current(currentRef.current - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Auto-scroll active slide in list ── */
  useEffect(() => {
    if (mode === "controller") {
      activeSlideRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [current, mode]);

  /* ── Broadcast helper ── */
  const broadcast = useCallback(
    (
      idx: number,
      bg: string,
      tr: string,
      font: string,
      size: string,
      tSpd: string,
      aSpd: string,
    ) => {
      channelRef.current?.postMessage({
        type: "UPDATE",
        slide: slides[idx] ?? "",
        bg,
        transition: tr,
        font,
        size,
        transSpeed: tSpd,
        animSpeed: aSpd,
      });
    },
    [slides],
  );

  /* ── Navigation & style change handlers ── */
  const goTo = (idx: number) => {
    const c = Math.max(0, Math.min(idx, slides.length - 1));
    setCurrent(c);
    broadcast(c, bgId, transitionId, fontId, sizeId, transSpeed, animSpeed);
  };
  const changeBg = (id: string) => {
    setBgId(id);
    broadcast(current, id, transitionId, fontId, sizeId, transSpeed, animSpeed);
  };
  const changeTr = (id: string) => {
    setTransId(id);
    broadcast(current, bgId, id, fontId, sizeId, transSpeed, animSpeed);
  };
  const changeFont = (id: string) => {
    setFontId(id);
    broadcast(current, bgId, transitionId, id, sizeId, transSpeed, animSpeed);
  };
  const changeSize = (id: string) => {
    setSizeId(id);
    broadcast(current, bgId, transitionId, fontId, id, transSpeed, animSpeed);
  };
  const changeTransSpeed = (id: string) => {
    setTransSpeed(id);
    broadcast(current, bgId, transitionId, fontId, sizeId, id, animSpeed);
  };
  const changeAnimSpeed = (id: string) => {
    setAnimSpeed(id);
    broadcast(current, bgId, transitionId, fontId, sizeId, transSpeed, id);
  };

  /* ── Save ── */
  const handleSave = async (songQueue: SongResult[] = []) => {
    if (!title.trim()) {
      setTitleError(true);
      toast.warning("Title is required", {
        description: "Please enter a title before saving.",
      });
      return;
    }
    setTitleError(false);
    setIsSaving(true);
    try {
      const body = { title, lyrics, songQueue, bgId, transitionId, fontId, sizeId };
      if (presentationDbId) {
        await api.put(`/presentations/${presentationDbId}`, body);
      } else {
        const { data: res } = await api.post<{ data: Presentation }>('/presentations', body);
        if (res.data?.id) {
          setPresentationDbId(res.data.id);
          router.replace(`/worship/editor?id=${res.data.id}`);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Presentation saved", {
        description: `"${title}" has been saved successfully.`,
      });
    } catch (err) {
      toast.error("Save failed", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Close presenter when the editor tab is closed (not SPA navigation) ── */
  useEffect(() => {
    const handlePageHide = () => {
      channelRef.current?.postMessage({ type: "CLOSE" });
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  /* ── Presenter window ── */
  const openPresenter = async () => {
    setMode("controller");
    setIsPresenterOpen(true);
    if (presentationDbId) {
      sessionStorage.setItem("worship-live-pres", presentationDbId);
    }
    let features = `left=${window.screen.width},top=0,width=${window.screen.width},height=${window.screen.height}`;
    try {
      if ("getScreenDetails" in window) {
        const sd = await (
          window as unknown as {
            getScreenDetails(): Promise<{
              screens: Array<{
                isPrimary: boolean;
                availLeft: number;
                availTop: number;
                availWidth: number;
                availHeight: number;
              }>;
            }>;
          }
        ).getScreenDetails();
        const second = sd.screens.find((s) => !s.isPrimary);
        if (second)
          features = `left=${second.availLeft},top=${second.availTop},width=${second.availWidth},height=${second.availHeight}`;
      }
    } catch {}
    presenterRef.current = window.open(
      "/worship/present",
      "worship-presenter",
      features,
    );
  };

  const endPresentation = () => {
    channelRef.current?.postMessage({ type: "CLOSE" });
    sessionStorage.removeItem("worship-live-pres");
    setIsPresenterOpen(false);
    setMode("editor");
  };

  /* ── Derived values ── */
  const bgCls = BACKGROUNDS.find((b) => b.id === bgId)?.cls ?? "";
  const currentFamily =
    FONTS.find((f) => f.id === fontId)?.family ?? "'Inter', sans-serif";
  const currentSlide = slides[current] ?? "";
  const nextSlide = slides[current + 1] ?? "";

  return {
    /* state */
    title,
    setTitle,
    lyrics,
    setLyrics,
    initialQueue,
    slides,
    setSlides,
    current,
    bgId,
    transitionId,
    fontId,
    sizeId,
    transSpeed,
    animSpeed,
    mode,
    setMode,
    isPresenterOpen,
    isSaving,
    saved,
    titleError,
    setTitleError,
    isLoading,
    /* refs */
    activeSlideRef,
    /* derived */
    bgCls,
    currentFamily,
    currentSlide,
    nextSlide,
    /* actions */
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
  };
}
