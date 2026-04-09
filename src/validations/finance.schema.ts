import { z } from 'zod';

export const FINANCE_ENTRY_TYPES = ['INCOME', 'EXPENSE'] as const;

export const ALL_FINANCE_CATEGORIES = [
  'REGISTRATION',
  'OFFERTORY',
  'DONATION',
  'OTHER_INCOME',
  'PRIZES',
  'DESIGN_PRINTING',
  'FOOD_BEVERAGE',
  'TRANSPORTATION',
  'VENUE',
  'SUPPLIES',
  'MARKETING',
  'OTHER_EXPENSE',
] as const;

// ─── OrgFund ──────────────────────────────────────────────────────────────────

export const orgFundSchema = z.object({
  initialBalance: z.number().min(0, 'Balance cannot be negative'),
  notes: z.string().optional(),
});

export type OrgFundInput = z.infer<typeof orgFundSchema>;

// ─── Ledger Entry ─────────────────────────────────────────────────────────────

export const ledgerEntrySchema = z.object({
  type: z.enum(FINANCE_ENTRY_TYPES),
  category: z.enum(ALL_FINANCE_CATEGORIES),
  customCategory: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  eventId: z.string().optional(),
  payee: z.string().optional(),
  requestedBy: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const updateLedgerEntrySchema = ledgerEntrySchema.partial();

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;
export type UpdateLedgerEntryInput = z.infer<typeof updateLedgerEntrySchema>;
