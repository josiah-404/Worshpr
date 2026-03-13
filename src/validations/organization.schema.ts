import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
