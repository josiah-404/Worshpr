import { z } from 'zod';
import { MAX_PDF_PAGES } from '@/lib/pdf-slides';

const songResultSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  year: z.string().optional(),
  excerpt: z.string().optional(),
  lyrics: z.string().optional(),
  lyricsSource: z.string().optional(),
  role: z.string().optional(),
  isSection: z.boolean().optional(),
  isBibleVerse: z.boolean().optional(),
  isDocument: z.boolean().optional(),
  pages: z.array(z.string().url()).max(MAX_PDF_PAGES).optional(),
});

export const createPresentationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  lyrics: z.string().default(''),
  songQueue: z.array(songResultSchema).optional().default([]),
  bgId: z.string().default('deep-space'),
  transitionId: z.string().default('fade'),
  fontId: z.string().default('inter'),
  sizeId: z.string().default('md'),
});

export const updatePresentationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  lyrics: z.string().optional(),
  songQueue: z.array(songResultSchema).optional(),
  bgId: z.string().optional(),
  transitionId: z.string().optional(),
  fontId: z.string().optional(),
  sizeId: z.string().optional(),
});

export type CreatePresentationInput = z.infer<typeof createPresentationSchema>;
export type UpdatePresentationInput = z.infer<typeof updatePresentationSchema>;
