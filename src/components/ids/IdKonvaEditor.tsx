'use client';

import { type FC, useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Line } from 'react-konva';
import type Konva from 'konva';
import { Minus, Plus, Bold, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ID_SIZES } from '@/lib/idSizes';
import type { LayoutField, LayoutFieldType, IdSizeId } from '@/types/id.types';

// ─── Constants ──────────────────────────────────────────────────────────────

const TEXT_FIELD_TYPES: LayoutFieldType[] = ['name', 'nickname', 'church', 'division', 'code'];
const OVERLAY_FIELD_TYPES = ['gradient-overlay', 'rect-overlay', 'stripe-overlay', 'solid-band', 'divider-line'];

const SAMPLE_TEXT: Partial<Record<LayoutFieldType, string>> = {
  name:     'Juan Dela Cruz',
  nickname: 'Juan',
  church:   'Sample Church',
  division: 'Youth Division',
  code:     'REG-ABCD-1234',
};

const FIELD_LABEL: Partial<Record<LayoutFieldType, string>> = {
  name:     'Full Name',
  nickname: 'Nickname',
  church:   'Church',
  division: 'Division',
  code:     'Code',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function coverCrop(img: HTMLImageElement, canvasW: number, canvasH: number) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = canvasW / canvasH;
  let cropX = 0, cropY = 0, cropW = img.naturalWidth, cropH = img.naturalHeight;
  if (imgAspect > canvasAspect) {
    cropH = img.naturalHeight;
    cropW = img.naturalHeight * canvasAspect;
    cropX = (img.naturalWidth - cropW) / 2;
  } else {
    cropW = img.naturalWidth;
    cropH = img.naturalWidth / canvasAspect;
    cropY = (img.naturalHeight - cropH) / 2;
  }
  return { x: cropX, y: cropY, width: cropW, height: cropH };
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface IdKonvaEditorProps {
  backgroundUrl: string;
  sizeId: IdSizeId;
  fields: LayoutField[];
  overlayColor: string;
  textColor: string;
  fontFamily: string;
  onChange: (fields: LayoutField[]) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const IdKonvaEditor: FC<IdKonvaEditorProps> = ({
  backgroundUrl, sizeId, fields, overlayColor, textColor, fontFamily, onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(420);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [selectedField, setSelectedField] = useState<LayoutFieldType | null>(null);

  const size = ID_SIZES[sizeId];
  const stageH = Math.round(stageW * size.heightPx / size.widthPx);

  // Observe container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load background
  useEffect(() => {
    if (!backgroundUrl) { setBgImage(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBgImage(img);
    img.src = backgroundUrl;
  }, [backgroundUrl]);

  const overlayFields = fields.filter((f) => OVERLAY_FIELD_TYPES.includes(f.field));
  const interactiveFields = fields.filter((f) => (TEXT_FIELD_TYPES as string[]).includes(f.field));

  const selectedData = selectedField ? fields.find((f) => f.field === selectedField) : null;

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function onTextDragEnd(f: LayoutField, e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target as Konva.Text;
    const fw = f.width * stageW;
    const fontSize = (f.fontSize ?? 0.06) * stageH;
    const newX = f.align === 'center' ? (node.x() + fw / 2) / stageW : node.x() / stageW;
    const newY = (node.y() + fontSize / 2) / stageH;
    onChange(fields.map((field) => field.field === f.field ? { ...field, x: newX, y: newY } : field));
  }

  // ── Property panel actions ─────────────────────────────────────────────────

  function adjustFontSize(delta: number) {
    if (!selectedField) return;
    onChange(fields.map((f) =>
      f.field === selectedField
        ? { ...f, fontSize: Math.max(0.02, Math.min(0.18, (f.fontSize ?? 0.06) + delta)) }
        : f,
    ));
  }

  function toggleBold() {
    if (!selectedField) return;
    onChange(fields.map((f) => f.field === selectedField ? { ...f, bold: !f.bold } : f));
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Stage */}
      <div ref={containerRef} className="w-full">
        <Stage
          width={stageW}
          height={stageH}
          style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}
          onClick={(e) => { if (e.target === e.target.getStage()) setSelectedField(null); }}
        >
          <Layer>
            {/* Background */}
            {bgImage && (
              <KonvaImage
                image={bgImage}
                width={stageW}
                height={stageH}
                crop={coverCrop(bgImage, stageW, stageH)}
                listening={false}
              />
            )}
            {!bgImage && (
              <Rect x={0} y={0} width={stageW} height={stageH} fill="#1a202c" listening={false} />
            )}

            {/* Overlay fields — static, non-interactive */}
            {overlayFields.map((f, i) => {
              const fy = f.y * stageH;
              const fh = (f.height ?? f.width) * stageH;
              const fw = f.width * stageW;
              const fx = f.x * stageW;

              if (f.field === 'gradient-overlay') return (
                <Rect key={i} x={0} y={fy} width={stageW} height={fh}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: 0, y: fh }}
                  fillLinearGradientColorStops={[0, 'rgba(0,0,0,0)', 1, hexToRgba(overlayColor, 0.88)]}
                  listening={false} />
              );

              if (f.field === 'rect-overlay') return (
                <Rect key={i} x={fx} y={fy} width={fw} height={fh}
                  fill={f.color ?? hexToRgba(overlayColor, 0.62)}
                  cornerRadius={stageW * 0.025} listening={false} />
              );

              if (f.field === 'stripe-overlay') return (
                <Rect key={i} x={0} y={fy} width={stageW} height={fh}
                  fill={f.color ?? 'rgba(255,255,255,0.95)'} listening={false} />
              );

              if (f.field === 'solid-band') return (
                <Rect key={i} x={fx} y={fy} width={fw} height={fh}
                  fill={hexToRgba(overlayColor, 1)} listening={false} />
              );

              if (f.field === 'divider-line') return (
                <Line key={i} points={[fx, fy, fx + fw, fy]}
                  stroke={f.color ?? 'rgba(255,255,255,0.45)'}
                  strokeWidth={Math.max(1, stageW * 0.003)} listening={false} />
              );

              return null;
            })}

            {/* Interactive text fields — draggable */}
            {interactiveFields.map((f) => {
              const isSelected = selectedField === f.field;
              const selectionColor = '#f97316';

              if ((TEXT_FIELD_TYPES as string[]).includes(f.field)) {
                const fontSize = (f.fontSize ?? 0.06) * stageH;
                const fw = f.width * stageW;
                const konvaX = f.align === 'center' ? f.x * stageW - fw / 2 : f.x * stageW;
                // Convert our middle-baseline y to Konva top-of-text y
                const konvaY = f.y * stageH - fontSize / 2;

                return (
                  <Text key={f.field}
                    x={konvaX} y={konvaY} width={fw}
                    text={SAMPLE_TEXT[f.field as LayoutFieldType] ?? f.field}
                    fontSize={fontSize}
                    fontFamily={`${fontFamily}, system-ui, sans-serif`}
                    fontStyle={f.bold ? 'bold' : 'normal'}
                    fill={f.color && !textColor ? f.color : textColor}
                    align={f.align ?? 'center'}
                    stroke={isSelected ? selectionColor : 'transparent'}
                    strokeWidth={isSelected ? 0.5 : 0}
                    draggable
                    onDragEnd={(e) => onTextDragEnd(f, e)}
                    onClick={() => setSelectedField(f.field as LayoutFieldType)}
                  />
                );
              }

              return null;
            })}

            {/* Selection highlight box */}
            {selectedData && (() => {
              const f = selectedData;
              const fontSize = (f.fontSize ?? 0.06) * stageH;
              const fw = f.width * stageW;
              const fh = fontSize * 1.4;
              const fx = f.align === 'center' ? f.x * stageW - fw / 2 : f.x * stageW;
              const fy = f.y * stageH - fontSize / 2;
              return (
                <Rect
                  x={fx - 3} y={fy - 3} width={fw + 6} height={fh + 6}
                  stroke="#f97316" strokeWidth={1.5} dash={[4, 3]}
                  fill="transparent" listening={false} cornerRadius={4}
                />
              );
            })()}
          </Layer>
        </Stage>
      </div>

      {/* Properties panel */}
      <div className="rounded-lg border border-border bg-card/60 px-4 py-2.5">
        {selectedData && selectedField ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {FIELD_LABEL[selectedField] ?? selectedField}
              </span>
            </div>

            {(TEXT_FIELD_TYPES as string[]).includes(selectedField) && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</span>
                  <button
                    className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => adjustFontSize(-0.004)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-mono w-8 text-center">
                    {Math.round((selectedData.fontSize ?? 0.06) * 1000)}
                  </span>
                  <button
                    className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => adjustFontSize(0.004)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="h-4 w-px bg-border" />
                <Button
                  size="sm" variant={selectedData.bold ? 'default' : 'outline'}
                  className="h-7 w-7 p-0"
                  onClick={toggleBold}
                  title={selectedData.bold ? 'Remove bold' : 'Make bold'}
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            <span className="text-[10px] text-muted-foreground ml-auto">
              Drag to reposition
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Click any field to select · Drag to reposition
          </p>
        )}
      </div>
    </div>
  );
};
