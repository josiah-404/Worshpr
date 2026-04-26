import type { IdLayout } from '@/types/id.types';

// NOTE: All text field y values are VISUAL CENTERS (textBaseline = 'middle').
// Overlay fields (gradient, rect, stripe, solid-band) use y = top edge.

export const ID_LAYOUTS: Record<string, IdLayout> = {

  // ── 1. Gradient Fade ────────────────────────────────────────────────────────
  'gradient-bottom': {
    id: 'gradient-bottom',
    label: 'Gradient Fade',
    description: 'Bottom fades to dark — name sits in the shadow',
    fields: [
      { field: 'gradient-overlay', x: 0,   y: 0.50, width: 1,    height: 0.50 },
      { field: 'name',   x: 0.5, y: 0.74, width: 0.88, align: 'center', fontSize: 0.072, bold: true,  color: '#ffffff' },
      { field: 'church', x: 0.5, y: 0.86, width: 0.80, align: 'center', fontSize: 0.045, bold: false, color: '#ffffffcc' },
      { field: 'code',   x: 0.5, y: 0.94, width: 0.68, align: 'center', fontSize: 0.032, bold: false, color: '#ffffff66' },
    ],
  },

  // ── 2. Name Plate ───────────────────────────────────────────────────────────
  'name-plate': {
    id: 'name-plate',
    label: 'Name Plate',
    description: 'Semi-transparent rectangle block with name inside',
    fields: [
      { field: 'rect-overlay', x: 0.04, y: 0.68, width: 0.92, height: 0.26, color: 'rgba(0,0,0,0.60)' },
      { field: 'name',   x: 0.5, y: 0.785, width: 0.84, align: 'center', fontSize: 0.068, bold: true,  color: '#ffffff' },
      { field: 'church', x: 0.5, y: 0.880, width: 0.78, align: 'center', fontSize: 0.042, bold: false, color: '#ffffffcc' },
    ],
  },

  // ── 3. Text Only ────────────────────────────────────────────────────────────
  'text-only': {
    id: 'text-only',
    label: 'Text Only',
    description: 'No photo — deep gradient with large centered name',
    fields: [
      { field: 'gradient-overlay', x: 0, y: 0.36, width: 1, height: 0.64 },
      { field: 'name',   x: 0.5, y: 0.60, width: 0.86, align: 'center', fontSize: 0.080, bold: true,  color: '#ffffff' },
      { field: 'church', x: 0.5, y: 0.74, width: 0.80, align: 'center', fontSize: 0.052, bold: false, color: '#ffffffcc' },
      { field: 'code',   x: 0.5, y: 0.85, width: 0.68, align: 'center', fontSize: 0.038, bold: false, color: '#ffffff66' },
    ],
  },

  // ── 7. Name Label ───────────────────────────────────────────────────────────
  'name-label': {
    id: 'name-label',
    label: 'Name Label',
    description: 'White sticker label in center — dark name text inside',
    fields: [
      { field: 'rect-overlay', x: 0.04, y: 0.50, width: 0.92, height: 0.28, color: 'rgba(255,255,255,0.93)' },
      { field: 'name',   x: 0.5, y: 0.628, width: 0.82, align: 'center', fontSize: 0.072, bold: true,  color: '#1a1a1a' },
      { field: 'church', x: 0.5, y: 0.735, width: 0.76, align: 'center', fontSize: 0.040, bold: false, color: '#555555' },
    ],
  },

  // ── 8. Hello Tag ────────────────────────────────────────────────────────────
  'hello-tag': {
    id: 'hello-tag',
    label: 'Hello Tag',
    description: 'White label + colored header bar — nickname inside',
    fields: [
      { field: 'rect-overlay', x: 0.04, y: 0.48, width: 0.92, height: 0.46, color: 'rgba(255,255,255,0.95)' },
      { field: 'solid-band',   x: 0.04, y: 0.48, width: 0.92, height: 0.12 },
      { field: 'nickname', x: 0.5, y: 0.695, width: 0.82, align: 'center', fontSize: 0.084, bold: true,  color: '#111111' },
      { field: 'church',   x: 0.5, y: 0.822, width: 0.76, align: 'center', fontSize: 0.038, bold: false, color: '#444444' },
    ],
  },

  // ── 9. Role Band ────────────────────────────────────────────────────────────
  'role-band': {
    id: 'role-band',
    label: 'Role Band',
    description: 'Solid theme-colored band at bottom with big bold name',
    fields: [
      { field: 'solid-band', x: 0, y: 0.68, width: 1, height: 0.32 },
      { field: 'name',   x: 0.5, y: 0.790, width: 0.86, align: 'center', fontSize: 0.080, bold: true,  color: '#ffffff' },
      { field: 'church', x: 0.5, y: 0.900, width: 0.78, align: 'center', fontSize: 0.036, bold: false, color: '#ffffffbb' },
    ],
  },

  // ── 10. Mid Stripe ──────────────────────────────────────────────────────────
  'mid-stripe': {
    id: 'mid-stripe',
    label: 'Mid Stripe',
    description: 'Light horizontal stripe across middle — bold name inside',
    fields: [
      { field: 'rect-overlay', x: 0, y: 0.52, width: 1, height: 0.22, color: 'rgba(235,215,175,0.94)' },
      { field: 'name',   x: 0.5, y: 0.630, width: 0.88, align: 'center', fontSize: 0.076, bold: true,  color: '#1a1005' },
      { field: 'church', x: 0.5, y: 0.790, width: 0.80, align: 'center', fontSize: 0.040, bold: false, color: '#ffffffcc' },
    ],
  },

  // ── 11. Full Stripe (Bethania style) ────────────────────────────────────────
  // Sharp full-width white stripe, name centered inside — no rounded corners
  'full-stripe': {
    id: 'full-stripe',
    label: 'Full Stripe',
    description: 'Sharp full-width stripe edge-to-edge — name centered inside',
    fields: [
      { field: 'stripe-overlay', x: 0, y: 0.62, width: 1, height: 0.20, color: 'rgba(255,255,255,0.95)' },
      { field: 'name',   x: 0.5, y: 0.720, width: 0.90, align: 'center', fontSize: 0.082, bold: true,  color: '#1a1a1a' },
      { field: 'church', x: 0.5, y: 0.880, width: 0.82, align: 'center', fontSize: 0.040, bold: false, color: '#ffffffcc' },
    ],
  },

  // ── 12. Underline Name (Mídia / Jhenny style) ────────────────────────────────
  // Dark overlay, thin lines flanking the name at the bottom
  'underline-name': {
    id: 'underline-name',
    label: 'Underline Name',
    description: 'Name at bottom with thin divider lines above and below',
    fields: [
      { field: 'gradient-overlay', x: 0, y: 0.55, width: 1, height: 0.45 },
      { field: 'divider-line', x: 0.08, y: 0.775, width: 0.84, color: 'rgba(255,255,255,0.45)' },
      { field: 'name',         x: 0.5,  y: 0.840, width: 0.84, align: 'center', fontSize: 0.076, bold: false, color: '#ffffff' },
      { field: 'divider-line', x: 0.08, y: 0.900, width: 0.84, color: 'rgba(255,255,255,0.45)' },
      { field: 'church',       x: 0.5,  y: 0.944, width: 0.80, align: 'center', fontSize: 0.036, bold: false, color: '#ffffff88' },
    ],
  },

  // ── 13. Stripe + Gradient (gradient below stripe, name in gradient) ──────────
  'stripe-gradient': {
    id: 'stripe-gradient',
    label: 'Stripe + Name',
    description: 'Themed solid stripe at top-half, gradient at bottom — name in gradient',
    fields: [
      { field: 'gradient-overlay', x: 0, y: 0.55, width: 1, height: 0.45 },
      { field: 'solid-band',       x: 0, y: 0.0,  width: 1, height: 0.22 },
      { field: 'name',   x: 0.5, y: 0.740, width: 0.88, align: 'center', fontSize: 0.074, bold: true,  color: '#ffffff' },
      { field: 'church', x: 0.5, y: 0.870, width: 0.80, align: 'center', fontSize: 0.042, bold: false, color: '#ffffffcc' },
    ],
  },

};

export const ID_LAYOUT_LIST = Object.values(ID_LAYOUTS);
