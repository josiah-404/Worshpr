export type IdSizeId =
  | 'cr80'
  | 'cr80-portrait'
  | 'lanyard'
  | 'badge-sm'
  | 'badge-lg'
  | 'a4-quarter';

export interface IdSize {
  id: IdSizeId;
  label: string;
  widthMm: number;
  heightMm: number;
  /** Pixel dimensions at 300 DPI for print-quality export */
  widthPx: number;
  heightPx: number;
  orientation: 'landscape' | 'portrait';
}

export type LayoutFieldType =
  | 'name' | 'nickname' | 'church' | 'division' | 'code'
  | 'gradient-overlay'  // fades bottom/top of image to a color — drawn before text
  | 'rect-overlay'      // semi-transparent rounded rectangle block — drawn before text
  | 'solid-band'        // full-opacity solid rect using theme overlay color — drawn before text
  | 'stripe-overlay'    // full-width sharp horizontal stripe (bleeds edge-to-edge) — drawn before text
  | 'divider-line';     // thin horizontal line (used as a separator under/over names)

export interface LayoutField {
  field: LayoutFieldType;
  /** 0–1 fraction of canvas width (center point for text, left edge for photo) */
  x: number;
  /** 0–1 fraction of canvas height (baseline for text, top edge for photo) */
  y: number;
  /** 0–1 fraction of canvas width */
  width: number;
  /** 0–1 fraction of canvas height — used for photo and qr only */
  height?: number;
  align?: 'left' | 'center' | 'right';
  /** 0–1 fraction of canvas height */
  fontSize?: number;
  bold?: boolean;
  color?: string;
  shape?: 'circle' | 'square';
}

export interface IdLayout {
  id: string;
  label: string;
  description: string;
  fields: LayoutField[];
}

export interface IdTemplateConfig {
  backgroundUrl: string;
  sizeId: IdSizeId;
  layoutId: string;
  layoutFields: LayoutField[];
  overlayColor: string; // hex — applied to gradient/rect overlay fields
  textColor: string;    // hex — overrides all text field colors
  fontFamily: string;   // font name e.g. "Poppins", "Montserrat"
}

export interface IdTemplateRecord {
  id: string;
  eventId: string;
  backgroundUrl: string;
  sizeId: string;
  layoutId: string;
  layoutFields: LayoutField[];
  overlayColor: string;
  textColor: string;
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdRegistrant {
  id: string;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  churchName: string | null;
  divisionOrgName: string | null;
  confirmationCode: string;
}
