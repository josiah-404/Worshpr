"use client";

import { useRef, useEffect, useState } from "react";

interface SlidePreviewProps {
  slide:       string;
  bgCls:       string;
  fontFamily:  string;
  /** Base font size in px at 1920px presenter resolution — scaled to container size automatically */
  fontSize:    number;
  ringClass?:  string;
  emptyText?:  string;
}

export function SlidePreview({
  slide, bgCls, fontFamily, fontSize,
  ringClass = "",
  emptyText = "No slide selected",
}: SlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1667); // default ~320/1920

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1920);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden ${ringClass}`}
      style={{ aspectRatio: "16/9" }}
    >
      {/* Background rendered at full presenter size then scaled down — preserves blur fidelity */}
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

      {/* Text layer */}
      <div className="absolute inset-0 flex items-center justify-center px-10">
        {slide ? (
          <p
            className="text-white text-center font-bold leading-tight drop-shadow-2xl whitespace-pre-line"
            style={{
              fontFamily,
              fontSize: Math.max(7, Math.round(fontSize * scale)),
              textShadow: "0 2px 20px rgba(0,0,0,0.85)",
            }}
          >
            {slide}
          </p>
        ) : (
          <p className="text-white/25 text-sm">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
