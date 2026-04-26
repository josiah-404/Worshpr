'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { drawId } from '@/lib/idCanvas';
import { ID_SIZES } from '@/lib/idSizes';
import type { IdRegistrant, LayoutField, IdSizeId } from '@/types/id.types';

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
  }: {
    registrants: IdRegistrant[];
    backgroundUrl: string;
    sizeId: string;
    fields: LayoutField[];
    overlayColor?: string;
    textColor?: string;
    fontFamily?: string;
    eventTitle: string;
  }) {
    if (registrants.length === 0) return;
    setExporting(true);
    try {
      const size = ID_SIZES[sizeId as IdSizeId];
      if (!size) throw new Error('Unknown size');

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: size.orientation,
        unit: 'mm',
        format: [size.widthMm, size.heightMm],
      });

      for (let i = 0; i < registrants.length; i++) {
        if (i > 0) doc.addPage([size.widthMm, size.heightMm], size.orientation);

        const canvas = document.createElement('canvas');
        await drawId(canvas, { registrant: registrants[i], fields, backgroundUrl, size, overlayColor, textColor, fontFamily  });

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, size.widthMm, size.heightMm);
      }

      const fileName = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-ids.pdf`;
      doc.save(fileName);
      toast.success(`Exported ${registrants.length} ID${registrants.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Export failed — please try again');
    } finally {
      setExporting(false);
    }
  }

  return { exportPdf, exporting };
}
