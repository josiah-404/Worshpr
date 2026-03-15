import { z } from 'zod';

const eventBaseSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  theme: z.string().min(1, 'Theme is required').max(200),
  description: z.string().optional(),
  type: z.enum(['camp', 'fellowship', 'seminar'], { message: 'Invalid event type' }),
  venue: z.string().optional(),
  isOngoing: z.boolean().default(false),
  isOpen: z.boolean().default(false),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  registrationFee: z.coerce.number().min(0).default(0),
  maxSlots: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'cancelled', 'completed']).default('draft'),
  coverImageUrl: z.string().optional(),
  createdBy: z.string().min(1),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  },
);

export const updateEventSchema = eventBaseSchema
  .omit({ createdBy: true })
  .partial()
  .refine(
    (data) =>
      !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
