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

export const registrantTypeSchema = z.object({
  label: z.string().min(1, 'Label is required'),
});

export const setRegistrantTypesSchema = z.object({
  items: z.array(registrantTypeSchema),
});

// Recursive — a question can have follow-up questions, each tied to one of its options.
// Needs an explicit type annotation (QuestionInput) since TS can't infer through the
// self-reference inside z.lazy(); the trailing cast sidesteps the contravariance mismatch
// between the schema's defaulted input shape and its resolved output shape (same class of
// issue as the zodResolver(...) as unknown as Resolver<T> casts used elsewhere).
export interface QuestionInput {
  label: string;
  type: 'TEXT' | 'CHOICE';
  options: string[];
  isRequired: boolean;
  triggerOption?: string;
  children: QuestionInput[];
}

export const questionSchema: z.ZodType<QuestionInput> = z.lazy(() =>
  z
    .object({
      label: z.string().min(1, 'Question is required'),
      type: z.enum(['TEXT', 'CHOICE']).default('TEXT'),
      options: z.array(z.string().min(1)).default([]),
      isRequired: z.boolean().default(false),
      triggerOption: z.string().optional(),
      children: z.array(questionSchema).default([]),
    })
    .refine((data) => data.type !== 'CHOICE' || data.options.length >= 2, {
      message: 'Choice questions need at least 2 options',
      path: ['options'],
    })
    .refine((data) => data.type === 'CHOICE' || data.children.length === 0, {
      message: 'Only choice questions can have follow-ups',
      path: ['children'],
    })
    .refine((data) => data.children.every((c) => data.options.includes(c.triggerOption ?? '')), {
      message: "Each follow-up must be tied to one of this question's options",
      path: ['children'],
    }),
) as z.ZodType<QuestionInput>;

export const setQuestionsSchema = z.object({
  items: z.array(questionSchema),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type InviteOrgInput = z.infer<typeof inviteOrgSchema>;
export type RespondInviteInput = z.infer<typeof respondInviteSchema>;
export type FeeItemInput = z.infer<typeof feeItemSchema>;
export type SetFeeItemsInput = z.infer<typeof setFeeItemsSchema>;
export type RegistrantTypeInput = z.infer<typeof registrantTypeSchema>;
export type SetRegistrantTypesInput = z.infer<typeof setRegistrantTypesSchema>;
export interface SetQuestionsInput {
  items: QuestionInput[];
}
