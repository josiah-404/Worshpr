"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize2 } from "lucide-react";
import { BACKGROUNDS, FONTS, SPEEDS, parseTitleSlide } from '@/lib/constants';

const BG_CLASSES: Record<string, string> = Object.fromEntries(
  BACKGROUNDS.map((b) => [b.id, b.cls])
);

const TR_CLASSES: Record<string, string> = {
  fade: "tr-fade",
  up:   "tr-up",
  zoom: "tr-zoom",
  blur: "tr-blur",
};

const FONT_FAMILIES: Record<string, string> = Object.fromEntries(
  FONTS.map((f) => [f.id, f.family])
);

const SIZE_STYLES: Record<string, string> = {
  sm: "clamp(1.4rem, 2.8vw, 2.4rem)",
  md: "clamp(1.8rem, 4vw,  3.5rem)",
  lg: "clamp(2.4rem, 5vw,  4.8rem)",
  xl: "clamp(3rem,   6.5vw, 6rem)",
};

export default function WorshipPresentPage() {
  const [slide, setSlide]          = useState("");
  const [bgId, setBgId]            = useState("deep-space");
  const [transitionId, setTransId] = useState("fade");
  const [fontId, setFontId]        = useState("inter");
  const [sizeId, setSizeId]        = useState("md");
  const [transSpeed, setTransSpeed] = useState("normal");
  const [animSpeed, setAnimSpeed]   = useState("normal");
  const [slideKey, setSlideKey]    = useState(0);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);

  /* BroadcastChannel */
  useEffect(() => {
    const channel = new BroadcastChannel("worship-presenter");

    channel.onmessage = (e) => {
      if (e.data?.type === "CLOSE") {
        document.exitFullscreen().catch(() => {}).finally(() => window.close());
        return;
      }
      if (e.data?.type === "UPDATE") {
        if (typeof e.data.slide       === "string") { setSlide(e.data.slide); setSlideKey((k) => k + 1); }
        if (typeof e.data.bg          === "string") setBgId(e.data.bg);
        if (typeof e.data.transition  === "string") setTransId(e.data.transition);
        if (typeof e.data.font        === "string") setFontId(e.data.font);
        if (typeof e.data.size        === "string") setSizeId(e.data.size);
        if (typeof e.data.transSpeed  === "string") setTransSpeed(e.data.transSpeed);
        if (typeof e.data.animSpeed   === "string") setAnimSpeed(e.data.animSpeed);
      }
    };

    channel.postMessage({ type: "REQUEST_STATE" });
    return () => channel.close();
  }, []);

  /* Auto-fullscreen — browsers allow this for popups opened from a user click */
  useEffect(() => {
    const tryFullscreen = () => {
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        setNeedsFullscreen(true);
      });
    };
    // Short delay lets the page paint first
    const t = setTimeout(tryFullscreen, 200);
    return () => clearTimeout(t);
  }, []);

  /* Apply animation playback rate to background element */
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const rate = SPEEDS.find((s) => s.id === animSpeed)?.animRate ?? 1;
    // Short delay so the new bg class has been applied and animations exist
    const t = setTimeout(() => {
      el.getAnimations({ subtree: true }).forEach((a) => {
        if (a instanceof CSSAnimation && !a.animationName.startsWith("tr-")) {
          a.playbackRate = rate;
        }
      });
    }, 50);
    return () => clearTimeout(t);
  }, [animSpeed, bgId]);

  const trDur = SPEEDS.find((s) => s.id === transSpeed)?.ms ?? 600;
  const bgCls = BG_CLASSES[bgId]         ?? "bg-deep-space";
  const trCls = TR_CLASSES[transitionId] ?? "tr-fade";
  const fontFamily = FONT_FAMILIES[fontId] ?? FONT_FAMILIES.inter;
  const fontSize   = SIZE_STYLES[sizeId]   ?? SIZE_STYLES.md;
  const titleParts = parseTitleSlide(slide);

  return (
    <div
      ref={bgRef}
      className={`fixed inset-0 overflow-hidden flex items-center justify-center ${bgCls}`}
      style={{ cursor: "none", ["--tr-dur" as string]: `${trDur}ms` }}
    >
      {/* Slide text */}
      {titleParts ? (
        <div
          key={slideKey}
          className={`flex flex-col items-center gap-3 text-center px-16 ${trCls}`}
        >
          <p
            className="text-white font-bold leading-tight drop-shadow-2xl"
            style={{ fontFamily, fontSize, textShadow: "0 2px 24px rgba(0,0,0,0.85)" }}
          >
            {titleParts.title}
          </p>
          <p
            className="text-white/65 font-medium leading-tight drop-shadow-xl"
            style={{
              fontFamily,
              fontSize: `calc(${fontSize} * 0.5)`,
              textShadow: "0 2px 16px rgba(0,0,0,0.75)",
            }}
          >
            {titleParts.artist}
          </p>
        </div>
      ) : slide ? (
        <p
          key={slideKey}
          className={`text-white text-center font-bold leading-tight drop-shadow-2xl whitespace-pre-line px-16 ${trCls}`}
          style={{ fontFamily, fontSize, textShadow: "0 2px 24px rgba(0,0,0,0.85)" }}
        >
          {slide}
        </p>
      ) : (
        <p
          className="text-white/20 text-center select-none"
          style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}
        >
          Waiting for slide...
        </p>
      )}

      {/* Fullscreen prompt — shown only if auto-fullscreen was blocked */}
      {needsFullscreen && (
        <button
          onClick={() => {
            document.documentElement.requestFullscreen({ navigationUI: "hide" })
              .then(() => setNeedsFullscreen(false))
              .catch(() => {});
          }}
          style={{ cursor: "default" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <Maximize2 className="h-4 w-4" />
          Click to enter fullscreen
        </button>
      )}
    </div>
  );
}
