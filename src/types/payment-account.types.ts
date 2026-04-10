import type { PaymentMethod } from '@/types/registration.types';

export interface PaymentAccount {
  id: string;
  orgId: string;
  method: PaymentMethod;
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  qrCodeUrl: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Minimal shape embedded in EventListItem and PublicEventData. */
export interface PaymentAccountSummary {
  id: string;
  method: PaymentMethod;
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  qrCodeUrl: string | null;
  instructions: string | null;
}
