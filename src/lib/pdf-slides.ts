/** Upper bound on pages per uploaded PDF — keeps upload time and storage reasonable. */
export const MAX_PDF_PAGES = 150;
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

/** Pages are rendered to fit inside a 1080p projector frame. */
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;
const JPEG_QUALITY = 0.9;
const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

/**
 * Renders each page of a PDF to a JPEG blob, one at a time, in the browser.
 * pdfjs is imported lazily so it never lands in the server bundle or the initial page JS.
 * `onPage` is called as soon as each page is ready so the caller can start uploading it
 * while the next page renders.
 */
export async function renderPdfPages(
  file: File,
  onPage: (blob: Blob, pageNumber: number, totalPages: number) => void,
): Promise<number> {
  const pdfjs = await import('pdfjs-dist');
  // Served as a static file: Next 14's minifier can't process the pre-minified worker if
  // it's bundled. public/pdf.worker.min.mjs must come from the same pdfjs-dist version
  // (pinned exactly in package.json) — re-copy it from node_modules when upgrading.
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    if (doc.numPages > MAX_PDF_PAGES) {
      throw new Error(`This PDF has ${doc.numPages} pages — the limit is ${MAX_PDF_PAGES}.`);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not create a canvas to render the PDF.');

    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(TARGET_WIDTH / base.width, TARGET_HEIGHT / base.height);
      const viewport = page.getViewport({ scale });

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      // White base so pages with transparent backgrounds don't turn black as JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      page.cleanup();

      onPage(await canvasToJpeg(canvas), n, doc.numPages);
    }

    return doc.numPages;
  } finally {
    void doc.destroy();
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode a PDF page.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
