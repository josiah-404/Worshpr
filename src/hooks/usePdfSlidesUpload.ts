'use client';

import { useState } from 'react';
import { useEdgeStore } from '@/lib/edgestore-client';
import { MAX_PDF_SIZE_BYTES, renderPdfPages } from '@/lib/pdf-slides';

export interface PdfUploadProgress {
  rendered: number;
  uploaded: number;
  total: number;
}

/**
 * Turns a PDF into slide images: renders each page in the browser, uploads it to the
 * Edgestore image bucket while the next page renders, and resolves with the page URLs
 * in order.
 */
export function usePdfSlidesUpload() {
  const { edgestore } = useEdgeStore();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<PdfUploadProgress | null>(null);

  const uploadPdf = async (file: File): Promise<string[]> => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Please choose a PDF file.');
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new Error('PDF is larger than 50 MB. Try exporting it with smaller images.');
    }

    setIsUploading(true);
    setProgress({ rendered: 0, uploaded: 0, total: 0 });
    const uploads: Promise<string>[] = [];

    try {
      await renderPdfPages(file, (blob, pageNumber, total) => {
        setProgress((p) => ({ uploaded: p?.uploaded ?? 0, rendered: pageNumber, total }));
        const pageFile = new File([blob], `${file.name.replace(/\.pdf$/i, '')}-p${pageNumber}.jpg`, {
          type: 'image/jpeg',
        });
        uploads.push(
          edgestore.imgBucket.upload({ file: pageFile }).then((res) => {
            setProgress((p) => (p ? { ...p, uploaded: p.uploaded + 1 } : p));
            return res.url;
          }),
        );
      });

      // Promise.all keeps page order regardless of which upload finishes first
      return await Promise.all(uploads);
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  return { uploadPdf, isUploading, progress };
}
