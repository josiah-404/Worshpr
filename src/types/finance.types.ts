// ─── Enums ────────────────────────────────────────────────────────────────────

export type FinanceEntryType = 'INCOME' | 'EXPENSE';

export type FinanceCategory =
  // Income
  | 'REGISTRATION'
  | 'OFFERTORY'
  | 'DONATION'
  | 'OTHER_INCOME'
  // Expense
  | 'PRIZES'
  | 'DESIGN_PRINTING'
  | 'FOOD_BEVERAGE'
  | 'TRANSPORTATION'
  | 'VENUE'
  | 'SUPPLIES'
  | 'MARKETING'
  | 'OTHER_EXPENSE';

export const INCOME_CATEGORIES: FinanceCategory[] = [
  'REGISTRATION',
  'OFFERTORY',
  'DONATION',
  'OTHER_INCOME',
];

export const EXPENSE_CATEGORIES: FinanceCategory[] = [
  'PRIZES',
  'DESIGN_PRINTING',
  'FOOD_BEVERAGE',
  'TRANSPORTATION',
  'VENUE',
  'SUPPLIES',
  'MARKETING',
  'OTHER_EXPENSE',
];

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  REGISTRATION: 'Registration',
  OFFERTORY: 'Offertory',
  DONATION: 'Donation',
  OTHER_INCOME: 'Other Income',
  PRIZES: 'Prizes',
  DESIGN_PRINTING: 'Design & Printing',
  FOOD_BEVERAGE: 'Food & Beverage',
  TRANSPORTATION: 'Transportation',
  VENUE: 'Venue',
  SUPPLIES: 'Supplies',
  MARKETING: 'Marketing',
  OTHER_EXPENSE: 'Other Expense',
};

// ─── OrgFund ──────────────────────────────────────────────────────────────────

export interface OrgFundDetail {
  id: string;
  orgId: string;
  initialBalance: number;
  currency: string;
  notes: string | null;
  /** Computed: initialBalance + totalIncome - totalExpenses */
  currentCOH: number;
  totalIncome: number;
  totalExpenses: number;
  updatedAt: string;
  createdAt: string;
}

export interface UpdateOrgFundPayload {
  initialBalance: number;
  notes?: string;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  orgId: string;
  eventId: string | null;
  eventTitle: string | null;
  type: FinanceEntryType;
  category: FinanceCategory;
  customCategory: string | null;
  amount: number;
  description: string;
  referenceId: string | null;
  payee: string | null;
  requestedBy: string | null;
  receiptUrl: string | null;
  enteredBy: string;
  enteredByName: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntryPayload {
  type: FinanceEntryType;
  category: FinanceCategory;
  customCategory?: string;
  amount: number;
  description: string;
  date: string;
  eventId?: string;
  payee?: string;
  requestedBy?: string;
  receiptUrl?: string;
  orgId?: string;
}

export interface UpdateLedgerEntryPayload extends Partial<LedgerEntryPayload> {}

// ─── Summaries ────────────────────────────────────────────────────────────────

export interface EventFinanceSummaryItem {
  eventId: string;
  eventTitle: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  registrationIncome: number;
  offertoryIncome: number;
  donationIncome: number;
  otherIncome: number;
}

export interface FinanceSummary {
  orgId: string;
  initialBalance: number;
  totalIncome: number;
  totalExpenses: number;
  currentCOH: number;
  standaloneExpenses: number;
  eventBreakdowns: EventFinanceSummaryItem[];
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface LedgerQueryParams {
  orgId?: string;
  eventId?: string;
  type?: FinanceEntryType;
  category?: FinanceCategory;
  dateFrom?: string;
  dateTo?: string;
}
