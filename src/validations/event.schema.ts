import { z } from 'zod';

// Base object — no refinements so we can call .omit() / .partial() on it
const eventBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CAMP', 'FELLOWSHIP', 'SEMINAR', 'WORSHIP_NIGHT', 'OTHER'], {
    error: 'Event type is required',
  }),
  customType: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  maxSlots: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().positive('Must be a positive number').optional(),
  ),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED']).default('DRAFT'),
  coverImage: z.string().optional(),
  themeColor: z.string().optional(),
  paymentAccountId: z.string().optional(),
  hostOrgId: z.string().min(1, 'Host organization is required'),
});

export const createEventSchema = eventBaseSchema
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date must be on or after start date', path: ['endDate'] },
  )
  .refine(
    (data) => data.type !== 'OTHER' || !!data.customType?.trim(),
    { message: 'Please specify the event type', path: ['customType'] },
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
  )
  .refine(
    (data) => data.type !== 'OTHER' || !!data.customType?.trim(),
    { message: 'Please specify the event type', path: ['customType'] },
  );

export const inviteOrgSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  role: z.enum(['HOST', 'COLLABORATOR']).default('COLLABORATOR'),
});

export const respondInviteSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export const feeItemSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  isRequired: z.boolean().default(false),
});

export const setFeeItemsSchema = z.object({
  items: z.array(feeItemSchema),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type InviteOrgInput = z.infer<typeof inviteOrgSchema>;
export type RespondInviteInput = z.infer<typeof respondInviteSchema>;
export type FeeItemInput = z.infer<typeof feeItemSchema>;
export type SetFeeItemsInput = z.infer<typeof setFeeItemsSchema>;
