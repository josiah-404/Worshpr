'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { drawId } from '@/lib/idCanvas';
import { resolveSize } from '@/lib/idSizes';
import type { IdRegistrant, LayoutField } from '@/types/id.types';

// ─── Paper sizes ───────────────────────────────────────────────────────────────

export type PaperSizeId = 'a4' | 'letter' | 'folio';

export const PAPER_SIZES: Record<PaperSizeId, { id: PaperSizeId; label: string; widthMm: number; heightMm: number }> = {
  a4:     { id: 'a4',     label: 'A4 (210×297 mm)',       widthMm: 210,   heightMm: 297   },
  letter: { id: 'letter', label: 'Letter (216×279 mm)',   widthMm: 215.9, heightMm: 279.4 },
  folio:  { id: 'folio',  label: 'Folio (216×330 mm)',    widthMm: 215.9, heightMm: 330.2 },
};

// ─── Grid calculation ─────────────────────────────────────────────────────────

const PAGE_MARGIN = 8;  // mm — margin on all four sides
const ID_GAP      = 3;  // mm — gap between IDs

function calcGrid(paperW: number, paperH: number, idW: number, idH: number) {
  const usableW = paperW - PAGE_MARGIN * 2;
  const usableH = paperH - PAGE_MARGIN * 2;
  const cols = Math.max(1, Math.floor((usableW + ID_GAP) / (idW + ID_GAP)));
  const rows = Math.max(1, Math.floor((usableH + ID_GAP) / (idH + ID_GAP)));
  // Centre the grid on the page
  const gridW = cols * idW + (cols - 1) * ID_GAP;
  const gridH = rows * idH + (rows - 1) * ID_GAP;
  const startX = (paperW - gridW) / 2;
  const startY = (paperH - gridH) / 2;
  return { cols, rows, idsPerPage: cols * rows, startX, startY };
}

// ─── Cut mark helper ──────────────────────────────────────────────────────────

function drawCutMarks(
  doc: import('jspdf').jsPDF,
  x: number, y: number, w: number, h: number,
) {
  const ARM  = 3;   // mm length of each mark arm
  const INSET = 1;  // mm gap between mark arm and card edge

  doc.setLineWidth(0.15);
  doc.setDrawColor(160, 160, 160);

  // corners: top-left, top-right, bottom-left, bottom-right
  const corners = [
    { cx: x,     cy: y     },
    { cx: x + w, cy: y     },
    { cx: x,     cy: y + h },
    { cx: x + w, cy: y + h },
  ];

  for (const { cx, cy } of corners) {
    const hDir = cx === x ? -1 : 1;  // horizontal arm direction
    const vDir = cy === y ? -1 : 1;  // vertical arm direction

    // horizontal arm
    doc.line(cx + hDir * INSET, cy, cx + hDir * (INSET + ARM), cy);
    // vertical arm
    doc.line(cx, cy + vDir * INSET, cx, cy + vDir * (INSET + ARM));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExportIdsPdf() {
  const [exporting, setExporting] = useState(false);

  async function exportPdf({
    registrants,
    backgroundUrl,
    sizeId,
    fields,
    overlayColor,
    textColor,
    fontFamily,
    eventTitle,
    customWidthMm,
    customHeightMm,
    paperSizeId = 'a4',
    paperOrientation = 'portrait' as 'portrait' | 'landscape',
  }: {
    registrants:        IdRegistrant[];
    backgroundUrl:      string;
    sizeId:             string;
    fields:             LayoutField[];
    overlayColor?:      string;
    textColor?:         string;
    fontFamily?:        string;
    eventTitle:         string;
    customWidthMm?:     number;
    customHeightMm?:    number;
    paperSizeId?:       PaperSizeId;
    paperOrientation?:  'portrait' | 'landscape';
  }) {
    if (registrants.length === 0) return;
    setExporting(true);

    try {
      const idSize = resolveSize(sizeId, customWidthMm, customHeightMm);
      const base   = PAPER_SIZES[paperSizeId];
      // Swap dimensions when landscape
      const paperW = paperOrientation === 'landscape' ? base.heightMm : base.widthMm;
      const paperH = paperOrientation === 'landscape' ? base.widthMm  : base.heightMm;

      const { cols, rows, idsPerPage, startX, startY } = calcGrid(
        paperW, paperH, idSize.widthMm, idSize.heightMm,
      );

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: paperOrientation,
        unit:        'mm',
        format:      [paperW, paperH],
        compress:    true,
      });

      // Print at actual size — no scaling in the print dialog
      doc.viewerPreferences({ PrintScaling: 'None', FitWindow: true });

      doc.setDocumentProperties({
        title:   `${eventTitle} — IDs`,
        subject: `${registrants.length} ID card(s) · ${idSize.widthMm}×${idSize.heightMm}mm on ${base.label}`,
        creator: 'EMBR',
        author:  'EMBR Event System',
      });

      // Pre-render all canvases
      const images: string[] = [];
      for (const registrant of registrants) {
        const canvas = document.createElement('canvas');
        await drawId(canvas, {
          registrant, fields, backgroundUrl,
          size: idSize, overlayColor, textColor, fontFamily,
        });
        images.push(canvas.toDataURL('image/jpeg', 0.95));
      }

      // Place IDs onto pages
      for (let i = 0; i < images.length; i++) {
        const posInPage = i % idsPerPage;

        // New page for every idsPerPage except the first
        if (posInPage === 0 && i > 0) {
          doc.addPage([paperW, paperH], paperOrientation);
        }

        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);

        const x = startX + col * (idSize.widthMm + ID_GAP);
        const y = startY + row * (idSize.heightMm + ID_GAP);

        // Place the ID image at exact physical dimensions
        doc.addImage(images[i], 'JPEG', x, y, idSize.widthMm, idSize.heightMm, undefined, 'FAST');

        // Cut marks so the card can be trimmed accurately
        drawCutMarks(doc, x, y, idSize.widthMm, idSize.heightMm);
      }

      const totalPages = Math.ceil(images.length / idsPerPage);
      const fileName = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-ids.pdf`;
      doc.save(fileName);

      toast.success(`Exported ${images.length} ID${images.length !== 1 ? 's' : ''}`, {
        description: `${cols}×${rows} per page · ${totalPages} page${totalPages !== 1 ? 's' : ''} · ${base.label} ${paperOrientation === 'landscape' ? '(Landscape)' : '(Portrait)'}`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Export failed — please try again');
    } finally {
      setExporting(false);
    }
  }

  return { exportPdf, exporting };
}
