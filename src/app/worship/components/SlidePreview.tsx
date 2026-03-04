interface SlidePreviewProps {
  slide:       string;
  bgCls:       string;
  fontFamily:  string;
  fontSize:    string;
  ringClass?:  string;
  emptyText?:  string;
}

export function SlidePreview({
  slide, bgCls, fontFamily, fontSize,
  ringClass = "",
  emptyText = "No slide selected",
}: SlidePreviewProps) {
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden ${bgCls} ${ringClass}`}
      style={{ aspectRatio: "16/9" }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-10">
        {slide ? (
          <p
            className="text-white text-center font-bold leading-tight drop-shadow-2xl whitespace-pre-line"
            style={{
              fontFamily,
              fontSize,
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
