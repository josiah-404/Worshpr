'use client';

import { type FC, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  eventTitle: string;
  orgName: string;
  dateRange: string;
  venue: string | null;
  registrationUrl: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
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
  ctx.fillText(line, x, currentY);
  return currentY;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Component ─────────────────────────────────────────────────────────────

export const QRModal: FC<QRModalProps> = ({
  open, onClose, eventTitle, orgName, dateRange, venue, registrationUrl,
}) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const hiddenQrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPrint() {
    // Get the high-res hidden QR canvas
    const qrCanvas = hiddenQrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    // Poster dimensions (2× for print quality)
    const W = 800;
    const SCALE = 2;

    // Calculate header height based on title length
    const HEADER_H = 210;
    const INFO_H = 70;
    const QR_PADDING = 60;
    const QR_SIZE = 380;
    const QR_SECTION_H = QR_SIZE + QR_PADDING * 2 + 50; // +50 for "Scan to Register" label
    const URL_H = 90;
    const FOOTER_H = 60;
    const H = HEADER_H + INFO_H + QR_SECTION_H + URL_H + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Header gradient ──────────────────────────────────────────────────────
    const headerGrad = ctx.createLinearGradient(0, 0, W, HEADER_H);
    headerGrad.addColorStop(0, '#ea580c');
    headerGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, W, HEADER_H);

    // Dot pattern overlay on header
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let px = 0; px < W; px += 20) {
      for (let py = 0; py < HEADER_H; py += 20) {
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // "EMBR" brand — top left
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.letterSpacing = '3px';
    ctx.fillText('EMBR', 36, 38);
    ctx.letterSpacing = '0px';

    // "SCAN TO REGISTER" — top right
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('SCAN TO REGISTER', W - 36, 38);

    // Event title — centered, word-wrapped
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const titleEndY = wrapText(ctx, eventTitle, W / 2, 90, W - 80, 42);

    // Org name
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgName, W / 2, titleEndY + 30);

    // ── Info strip ───────────────────────────────────────────────────────────
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, HEADER_H, W, INFO_H);

    // Thin top border on strip
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(W, HEADER_H);
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';

    const infoY = HEADER_H + INFO_H / 2 + 5;
    const infoParts = [`📅  ${dateRange}`, venue ? `📍  ${venue}` : null].filter(Boolean);
    ctx.fillText(infoParts.join('      '), W / 2, infoY);

    // ── QR Section ───────────────────────────────────────────────────────────
    const qrSectionTop = HEADER_H + INFO_H;

    // "Scan to Register" label
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Register', W / 2, qrSectionTop + 44);

    // QR card shadow + background
    const qrX = (W - QR_SIZE) / 2;
    const qrY = qrSectionTop + 60;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 16, qrY - 16, QR_SIZE + 32, QR_SIZE + 32, 16);
    ctx.fill();
    ctx.restore();

    // Draw QR code
    ctx.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);

    // ── URL Section ──────────────────────────────────────────────────────────
    const urlSectionTop = qrSectionTop + QR_SECTION_H;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, urlSectionTop, W, URL_H);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, urlSectionTop);
    ctx.lineTo(W, urlSectionTop);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REGISTRATION LINK', W / 2, urlSectionTop + 26);

    ctx.fillStyle = '#374151';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(registrationUrl, W / 2, urlSectionTop + 54);

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerTop = urlSectionTop + URL_H;
    const footerGrad = ctx.createLinearGradient(0, footerTop, W, footerTop + FOOTER_H);
    footerGrad.addColorStop(0, '#ea580c');
    footerGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, footerTop, W, FOOTER_H);

    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Powered by EMBR  ·  Register Online', W / 2, footerTop + FOOTER_H / 2 + 5);

    // ── Download ─────────────────────────────────────────────────────────────
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-registration-qr.png`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Registration QR Code</DialogTitle>
        </DialogHeader>

        {/* QR Preview */}
        <div ref={qrContainerRef} className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-xl border border-border p-4 bg-white">
            <QRCodeCanvas
              value={registrationUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center break-all px-2 leading-relaxed">
            {registrationUrl}
          </p>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button className="w-full gap-2" onClick={() => window.open(registrationUrl, '_blank')}>
            <ExternalLink className="h-4 w-4" />
            Open Registration Page
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadPrint}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Hidden high-res QR used only for the print download */}
        <div ref={hiddenQrRef} className="hidden" aria-hidden>
          <QRCodeCanvas
            value={registrationUrl}
            size={380}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
