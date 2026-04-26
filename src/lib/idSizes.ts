import type { IdSize, IdSizeId } from '@/types/id.types';

export const ID_SIZES: Record<IdSizeId, IdSize> = {
  'cr80': {
    id: 'cr80',
    label: 'Standard ID (CR80)',
    widthMm: 85.6,
    heightMm: 54,
    widthPx: 1012,
    heightPx: 638,
    orientation: 'landscape',
  },
  'cr80-portrait': {
    id: 'cr80-portrait',
    label: 'Portrait ID Card',
    widthMm: 54,
    heightMm: 85.6,
    widthPx: 638,
    heightPx: 1012,
    orientation: 'portrait',
  },
  'lanyard': {
    id: 'lanyard',
    label: 'Lanyard Badge',
    widthMm: 88.9,
    heightMm: 127,
    widthPx: 1051,
    heightPx: 1501,
    orientation: 'portrait',
  },
  'badge-sm': {
    id: 'badge-sm',
    label: 'Small Badge (2.5"×3.5")',
    widthMm: 63.5,
    heightMm: 88.9,
    widthPx: 750,
    heightPx: 1051,
    orientation: 'portrait',
  },
  'badge-lg': {
    id: 'badge-lg',
    label: 'Large Badge (4"×6")',
    widthMm: 101.6,
    heightMm: 152.4,
    widthPx: 1201,
    heightPx: 1800,
    orientation: 'portrait',
  },
  'a4-quarter': {
    id: 'a4-quarter',
    label: 'A4 Quarter',
    widthMm: 105,
    heightMm: 148.5,
    widthPx: 1240,
    heightPx: 1755,
    orientation: 'portrait',
  },
};

export const ID_SIZE_LIST = Object.values(ID_SIZES);
