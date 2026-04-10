import { z } from 'zod';

export const createPaymentAccountSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  method: z.enum(['GCASH', 'MAYA', 'BANK_TRANSFER', 'OTHER'], { error: 'Method is required' }),
  label: z.string().min(1, 'Label is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updatePaymentAccountSchema = createPaymentAccountSchema.omit({ orgId: true }).partial();

export type CreatePaymentAccountInput = z.infer<typeof createPaymentAccountSchema>;
export type UpdatePaymentAccountInput = z.infer<typeof updatePaymentAccountSchema>;
