import { z } from 'zod';

export const orgMembershipRoleSchema = z.enum(['org_admin', 'officer']);

export const membershipSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  role: orgMembershipRoleSchema,
  title: z.string().optional(),
});

const userBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  isSuperAdmin: z.boolean().default(false),
  memberships: z.array(membershipSchema).default([]),
});

export const createUserSchema = userBaseSchema.superRefine((data, ctx) => {
  if (!data.isSuperAdmin && data.memberships.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one organization membership is required',
      path: ['memberships'],
    });
  }
  if (data.isSuperAdmin && data.memberships.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Super admins cannot have organization memberships',
      path: ['memberships'],
    });
  }
  data.memberships.forEach((m, i) => {
    if (m.role === 'officer' && !m.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title is required for officers',
        path: ['memberships', i, 'title'],
      });
    }
    if (m.role === 'org_admin' && m.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Org admins cannot have a title',
        path: ['memberships', i, 'title'],
      });
    }
  });
});

export const updateUserSchema = createUserSchema;

export const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const setupPasswordClientSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetupPasswordInput = z.infer<typeof setupPasswordSchema>;
export type SetupPasswordClientInput = z.infer<typeof setupPasswordClientSchema>;
