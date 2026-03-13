import { z } from 'zod';

export const orgRoleSchema = z.enum(['super_admin', 'org_admin', 'officer']);

const userBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: orgRoleSchema.default('officer'),
  orgId: z.string().optional(),
  title: z.string().optional(),
});

export const createUserSchema = userBaseSchema
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'super_admin' && !data.orgId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organization is required',
        path: ['orgId'],
      });
    }
  });

export const updateUserSchema = userBaseSchema
  .extend({
    password: z.string().min(6).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'super_admin' && !data.orgId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organization is required',
        path: ['orgId'],
      });
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
