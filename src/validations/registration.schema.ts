import { z } from 'zod';

export const registrantSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nickname: z.string().optional(),
  email: z.email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  birthday: z.string().min(1, 'Birthday is required'),
  address: z.string().min(1, 'Address is required'),
  church: z.string().optional(),
  organization: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
});

export const paymentSchema = z.object({
  amount: z.number().min(0, 'Amount cannot be negative'),
  method: z.enum(['CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER', 'OTHER'], {
    error: 'Payment method is required',
  }),
  receiptUrl: z.string().optional(),
  referenceNo: z.string().optional(),
});

export const registrationGroupSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  submittedByName: z.string().min(1, 'Your name is required'),
  submittedByEmail: z.email('Invalid email address'),
  registrants: z.array(registrantSchema).min(1, 'At least one registrant is required'),
  paymentIntent: z.enum(['CASH', 'ONLINE', 'FREE'], {
    error: 'Payment intent is required',
  }),
  payment: paymentSchema.optional(),
});

export type RegistrantInput = z.infer<typeof registrantSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type RegistrationGroupInput = z.infer<typeof registrationGroupSchema>;
