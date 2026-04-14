import { z } from 'zod';

export const upsertProgramSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'FINAL']).optional(),
  totalDays: z.number().int().min(1).max(30).optional(),
});

export const createProgramItemSchema = z.object({
  day: z.number().int().min(1),
  type: z.enum(['SESSION_HEADER', 'ITEM']).default('ITEM'),
  session: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .optional(),
  churchId: z.string().optional(),
  presenterName: z.string().max(100).optional(),
});

export const updateProgramItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .nullable()
    .optional(),
  churchId: z.string().nullable().optional(),
  presenterName: z.string().max(100).nullable().optional(),
  session: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).nullable().optional(),
  day: z.number().int().min(1).optional(),
});

export const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    }),
  ),
});

export type UpsertProgramInput = z.infer<typeof upsertProgramSchema>;
export type CreateProgramItemInput = z.infer<typeof createProgramItemSchema>;
export type UpdateProgramItemInput = z.infer<typeof updateProgramItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
