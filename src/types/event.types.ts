import type { PaymentAccountSummary } from '@/types/payment-account.types';

export type EventType = 'CAMP' | 'FELLOWSHIP' | 'SEMINAR' | 'WORSHIP_NIGHT' | 'OTHER';
export type EventStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
export type EventOrgRole = 'HOST' | 'COLLABORATOR';
export type EventInviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface EventFeeItem {
  id: string;
  label: string;
  amount: number;
  isRequired: boolean;
  order: number;
}

export interface EventFeeItemInput {
  label: string;
  amount: number;
  isRequired: boolean;
}

export interface EventOrg {
  id: string;
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  role: EventOrgRole;
  inviteStatus: EventInviteStatus;
}

export interface CollaborationInvite {
  id: string;
  eventId: string;
  orgId: string;
  role: EventOrgRole;
  inviteStatus: EventInviteStatus;
  invitedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    type: EventType;
    customType: string | null;
    status: EventStatus;
    startDate: string;
    endDate: string;
    venue: string | null;
    coverImage: string | null;
    description: string | null;
    hostOrg: {
      orgId: string;
      orgName: string;
      orgLogoUrl: string | null;
    } | null;
  };
}

export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: EventType;
  customType: string | null;
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  maxSlots: number | null;
  status: EventStatus;
  coverImage: string | null;
  themeColor: string | null;
  paymentAccount: PaymentAccountSummary | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  organizations: EventOrg[];
  feeItems: EventFeeItem[];
}
