import { z } from 'zod';

// Base object — no refinements so we can call .omit() / .partial() on it
const eventBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CAMP', 'FELLOWSHIP', 'SEMINAR', 'WORSHIP_NIGHT'], {
    error: 'Event type is required',
  }),
  venue: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  fee: z.coerce.number().min(0, 'Fee cannot be negative').default(0),
  maxSlots: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().positive('Must be a positive number').optional(),
  ),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED']).default('DRAFT'),
  coverImage: z.string().optional(),
  hostOrgId: z.string().min(1, 'Host organization is required'),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be on or after start date', path: ['endDate'] },
);

export const updateEventSchema = eventBaseSchema
  .omit({ hostOrgId: true })
  .partial()
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] },
  );

export const inviteOrgSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  role: z.enum(['HOST', 'COLLABORATOR']).default('COLLABORATOR'),
});

export const respondInviteSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type InviteOrgInput = z.infer<typeof inviteOrgSchema>;
export type RespondInviteInput = z.infer<typeof respondInviteSchema>;
