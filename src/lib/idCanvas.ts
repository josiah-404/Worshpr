import type { IdSize, LayoutField, LayoutFieldType, IdRegistrant } from '@/types/id.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

function getFieldValue(fieldType: LayoutField['field'], registrant: IdRegistrant): string {
  switch (fieldType) {
    case 'name':     return registrant.fullName;
    case 'nickname': return registrant.nickname ?? registrant.fullName;
    case 'church':   return registrant.churchName ?? '';
    case 'division': return registrant.divisionOrgName ?? '';
    case 'code':     return registrant.confirmationCode;
    default:         return '';
  }
}

// ─── Options ────────────────────────────────────────────────────────────────

export interface DrawIdOptions {
  registrant: IdRegistrant;
  fields: LayoutField[];
  backgroundUrl: string;
  size: IdSize;
  overlayColor?: string;
  textColor?: string;
  fontFamily?: string;
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function overlayRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

const PRIMARY_TEXT_FIELDS: LayoutFieldType[] = ['name', 'nickname'];
const SECONDARY_TEXT_FIELDS: LayoutFieldType[] = ['church', 'division', 'code'];

// ─── Main draw function ──────────────────────────────────────────────────────

export async function drawId(
  canvas: HTMLCanvasElement,
  { registrant, fields, backgroundUrl, size, overlayColor, textColor, fontFamily }: DrawIdOptions,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width  = size.widthPx;
  canvas.height = size.heightPx;

  const W = canvas.width;
  const H = canvas.height;

  // ── Background (object-fit: cover) ─────────────────────────────────────────
  if (backgroundUrl) {
    try {
      const bgImg = await loadImage(backgroundUrl);
      const imgAspect    = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasAspect = W / H;
      let srcX = 0, srcY = 0, srcW = bgImg.naturalWidth, srcH = bgImg.naturalHeight;

      if (imgAspect > canvasAspect) {
        srcH = bgImg.naturalHeight;
        srcW = srcH * canvasAspect;
        srcX = (bgImg.naturalWidth - srcW) / 2;
      } else {
        srcW = bgImg.naturalWidth;
        srcH = srcW / canvasAspect;
        srcY = (bgImg.naturalHeight - srcH) / 2;
      }

      ctx.drawImage(bgImg, srcX, srcY, srcW, srcH, 0, 0, W, H);
    } catch {
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, W, H);
  }

  // ── Pre-load web font ────────────────────────────────────────────────────────
  const resolvedFont = fontFamily && fontFamily !== 'system-ui' ? fontFamily : null;
  if (resolvedFont && typeof document !== 'undefined') {
    await Promise.allSettled([
      document.fonts.load(`bold 40px "${resolvedFont}"`),
      document.fonts.load(`40px "${resolvedFont}"`),
    ]);
  }

  // ── Fields ───────────────────────────────────────────────────────────────────
  for (const f of fields) {
    const fx = f.x * W;
    const fy = f.y * H;
    const fw = f.width * W;
    const fh = (f.height ?? f.width) * H;

    // Overlay backgrounds
    if (f.field === 'gradient-overlay') {
      ctx.save();
      const grad = ctx.createLinearGradient(0, fy, 0, fy + fh);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, overlayColor ? overlayRgba(overlayColor, 0.88) : (f.color ?? 'rgba(0,0,0,0.88)'));
      ctx.fillStyle = grad;
      ctx.fillRect(0, fy, W, fh);
      ctx.restore();
      continue;
    }

    if (f.field === 'rect-overlay') {
      ctx.save();
      ctx.fillStyle = overlayColor ? overlayRgba(overlayColor, 0.62) : (f.color ?? 'rgba(0,0,0,0.62)');
      ctx.beginPath();
      ctx.roundRect(fx, fy, fw, fh, W * 0.025);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (f.field === 'solid-band') {
      ctx.save();
      ctx.fillStyle = overlayColor ? overlayRgba(overlayColor, 1) : (f.color ?? 'rgba(0,0,0,0.9)');
      const r = fh < H * 0.18 ? [W * 0.02, W * 0.02, 0, 0] : W * 0.02;
      ctx.beginPath();
      ctx.roundRect(fx, fy, fw, fh, r);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (f.field === 'stripe-overlay') {
      ctx.save();
      ctx.fillStyle = f.color ?? 'rgba(255,255,255,0.95)';
      ctx.fillRect(0, fy, W, fh);
      ctx.restore();
      continue;
    }

    if (f.field === 'divider-line') {
      ctx.save();
      ctx.strokeStyle = f.color ?? 'rgba(255,255,255,0.5)';
      ctx.lineWidth = Math.max(1, W * 0.003);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + fw, fy);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    // Text fields
    const text = getFieldValue(f.field, registrant);
    if (!text) continue;

    const fontSize = (f.fontSize ?? 0.06) * H;

    let resolvedColor = f.color ?? '#ffffff';
    if (textColor) {
      const [r, g, b] = hexToRgb(textColor);
      if (PRIMARY_TEXT_FIELDS.includes(f.field as LayoutFieldType)) {
        resolvedColor = `rgb(${r},${g},${b})`;
      } else if (SECONDARY_TEXT_FIELDS.includes(f.field as LayoutFieldType)) {
        resolvedColor = `rgba(${r},${g},${b},0.75)`;
      }
    }

    const fontStr = resolvedFont
      ? `"${resolvedFont}", system-ui, sans-serif`
      : 'system-ui, -apple-system, sans-serif';

    ctx.save();
    ctx.font = `${f.bold ? 'bold ' : ''}${fontSize}px ${fontStr}`;
    ctx.fillStyle = resolvedColor;
    ctx.textAlign = f.align ?? 'left';
    ctx.textBaseline = 'middle';
    wrapText(ctx, text, fx, fy, fw, fontSize * 1.3);
    ctx.restore();
  }
}
