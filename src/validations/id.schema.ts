import { z } from 'zod';

export const idTemplateSchema = z.object({
  backgroundUrl: z.string().min(1, 'Background image is required'),
  sizeId: z.string().min(1, 'Size is required'),
  layoutId: z.string().min(1, 'Layout is required'),
  layoutFields: z.array(z.record(z.string(), z.unknown())),
  overlayColor: z.string().default('#000000'),
  textColor: z.string().default('#ffffff'),
  fontFamily: z.string().default('Poppins'),
});

export type IdTemplateInput = z.infer<typeof idTemplateSchema>;
