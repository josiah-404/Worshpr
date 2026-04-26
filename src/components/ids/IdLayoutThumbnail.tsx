'use client';

import { type FC } from 'react';
import type { IdLayout, LayoutField } from '@/types/id.types';

const TW = 60;
const TH = 86;

interface IdLayoutThumbnailProps {
  layout: IdLayout;
  overlayColor?: string;
}

function textBarWidth(field: string, fw: number): number {
  const ratios: Record<string, number> = { name: 1, nickname: 0.75, church: 0.65, division: 0.55, code: 0.45 };
  return fw * (ratios[field] ?? 0.7);
}

function textBarHeight(field: string): number {
  const heights: Record<string, number> = { name: 5, nickname: 4.5, church: 3, division: 2.5, code: 2 };
  return heights[field] ?? 3;
}

function textBarOpacity(field: string): number {
  const ops: Record<string, number> = { name: 0.9, nickname: 0.85, church: 0.6, division: 0.5, code: 0.35 };
  return ops[field] ?? 0.6;
}

function hexToRgbStr(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export const IdLayoutThumbnail: FC<IdLayoutThumbnailProps> = ({ layout, overlayColor = '#000000' }) => {
  const gradients = layout.fields.filter((f) => f.field === 'gradient-overlay');
  const uid = layout.id.replace(/[^a-z0-9]/g, '');

  return (
    <svg
      width={TW} height={TH}
      viewBox={`0 0 ${TW} ${TH}`}
      className="rounded overflow-hidden"
      style={{ display: 'block' }}
    >
      <defs>
        {gradients.map((_, i) => (
          <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={`rgb(${hexToRgbStr(overlayColor)})`} stopOpacity={0.92} />
          </linearGradient>
        ))}
      </defs>

      {/* Card background */}
      <rect x={0} y={0} width={TW} height={TH} fill="#1a1f2e" />

      {/* Subtle grid texture */}
      <rect x={0} y={0} width={TW} height={TH} fill="url(#noise)" opacity={0.04} />

      {layout.fields.map((f, i) => {
        const fy = f.y * TH;
        const fh = (f.height ?? f.width) * TH;
        const fw = f.width * TW;
        const fx = f.align === 'center' ? f.x * TW - fw / 2 : f.x * TW;
        const safeFx = Math.max(0, fx);
        const gradIdx = gradients.indexOf(f);

        if (f.field === 'gradient-overlay') return (
          <rect key={i} x={0} y={fy} width={TW} height={fh}
            fill={`url(#${uid}-g${gradIdx})`} />
        );

        if (f.field === 'rect-overlay') return (
          <rect key={i} x={safeFx} y={fy} width={Math.min(fw, TW - safeFx)} height={fh}
            fill={f.color ?? `rgba(${hexToRgbStr(overlayColor)},0.55)`} rx={1.5} />
        );

        if (f.field === 'stripe-overlay') return (
          <rect key={i} x={0} y={fy} width={TW} height={fh}
            fill={f.color ?? 'rgba(255,255,255,0.93)'} />
        );

        if (f.field === 'solid-band') return (
          <rect key={i} x={0} y={fy} width={TW} height={fh}
            fill={`rgb(${hexToRgbStr(overlayColor)})`} opacity={0.95} />
        );

        if (f.field === 'divider-line') return (
          <line key={i} x1={safeFx} y1={fy} x2={safeFx + Math.min(fw, TW - safeFx)} y2={fy}
            stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
        );

        // Text fields — horizontal bar simulation
        const barH = textBarHeight(f.field as string);
        const barW = Math.min(textBarWidth(f.field as string, fw), TW - safeFx);
        const barOpacity = textBarOpacity(f.field as string);
        // Center the bar horizontally if center-aligned
        const barX = f.align === 'center' ? TW / 2 - barW / 2 : safeFx;

        // Check if this text is on a light background (stripe/rect-overlay with white-ish color)
        const isOnLight = layout.fields.some((bg) =>
          (bg.field === 'stripe-overlay' || bg.field === 'rect-overlay') &&
          bg.y <= f.y && (bg.y + (bg.height ?? bg.width)) >= f.y &&
          (bg.color ?? '').includes('255,255,255'),
        );

        return (
          <rect key={i} x={barX} y={fy - barH / 2} width={barW} height={barH} rx={barH / 3}
            fill={isOnLight ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,1)'}
            opacity={isOnLight ? 0.75 : barOpacity} />
        );
      })}

      {/* Border */}
      <rect x={0} y={0} width={TW} height={TH} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} rx={2} />
    </svg>
  );
};
