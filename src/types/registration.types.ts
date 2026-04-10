import type { PaymentAccountSummary } from '@/types/payment-account.types';
import type { ChurchOption } from '@/types/church.types';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentIntent = 'CASH' | 'ONLINE' | 'FREE';
export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface RegistrantData {
  fullName: string;
  nickname?: string;
  email: string;
  phone: string;
  birthday: string; // ISO date string
  address: string;
  churchId?: string;
  divisionOrgId?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PaymentPayload {
  amount: number;
  method: PaymentMethod;
  receiptUrl?: string;
  referenceNo?: string;
}

export interface RegistrationGroupPayload {
  eventId: string;
  submittedByName: string;
  submittedByEmail: string;
  registrants: RegistrantData[];
  paymentIntent: PaymentIntent;
  payment?: PaymentPayload;
}

export interface EventOrgOption {
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  role: 'HOST' | 'COLLABORATOR';
}

/** Public event data returned by the by-slug API (no auth required). */
export interface PublicEventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  fee: number;
  maxSlots: number | null;
  status: string;
  coverImage: string | null;
  themeColor: string | null;
  paymentAccount: PaymentAccountSummary | null;
  hostOrg: {
    orgId: string;
    orgName: string;
    orgLogoUrl: string | null;
  } | null;
  /** All accepted organizations (host + collaborators) for the org dropdown. */
  organizations: EventOrgOption[];
  /** Approved registration count — used to check remaining slots. */
  registrationCount: number;
  /** Churches participating in this event — empty means registration is blocked. */
  churches: ChurchOption[];
}

export interface PaymentDetail {
  id: string;
  amount: number;
  method: PaymentMethod;
  receiptUrl: string | null;
  referenceNo: string | null;
  status: PaymentStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RegistrantDetail {
  id: string;
  fullName: string;
  nickname: string | null;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  churchId: string | null;
  churchName: string | null;
  divisionOrgId: string | null;
  divisionOrgName: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface RegistrationListItem {
  id: string;
  eventId: string;
  orgId: string;
  status: RegistrationStatus;
  paymentIntent: PaymentIntent;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  registrant: RegistrantDetail;
  group: {
    id: string;
    confirmationCode: string;
    submittedByName: string;
    submittedByEmail: string;
    headcount: number;
    createdAt: string;
  };
  payment: PaymentDetail | null;
}

export interface RegistrationGroupResult {
  confirmationCode: string;
  headcount: number;
  registrations: Array<{
    id: string;
    registrantId: string;
    fullName: string;
    email: string;
  }>;
}
