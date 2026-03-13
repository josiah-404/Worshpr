import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

/**
 * EdgeStore router — add bucket definitions here as the app grows.
 * Example: publicFiles for general uploads, profileImages for avatars, etc.
 */
export const edgeStoreRouter = es.router({
  /** General file uploads (File Bucket) */
  fileBucket: es.fileBucket(),
  /** Image uploads (Img Bucket) — imageBucket already restricts to image types */
  imgBucket: es.imageBucket(),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export type EdgeStoreRouter = typeof edgeStoreRouter;
