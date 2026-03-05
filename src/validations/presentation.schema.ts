import { z } from 'zod';

export const createPresentationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  lyrics: z.string().default(''),
  bgId: z.string().default('deep-space'),
  transitionId: z.string().default('fade'),
  fontId: z.string().default('inter'),
  sizeId: z.string().default('md'),
});

export const updatePresentationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  lyrics: z.string().optional(),
  bgId: z.string().optional(),
  transitionId: z.string().optional(),
  fontId: z.string().optional(),
  sizeId: z.string().optional(),
});

export type CreatePresentationInput = z.infer<typeof createPresentationSchema>;
export type UpdatePresentationInput = z.infer<typeof updatePresentationSchema>;
