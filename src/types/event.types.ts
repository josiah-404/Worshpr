import type { PaymentAccountSummary } from '@/types/payment-account.types';

export type EventType = 'CAMP' | 'FELLOWSHIP' | 'SEMINAR' | 'WORSHIP_NIGHT';
export type EventStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
export type EventOrgRole = 'HOST' | 'COLLABORATOR';
export type EventInviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

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
    status: EventStatus;
    startDate: string;
    endDate: string;
    venue: string | null;
    coverImage: string | null;
    fee: number;
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
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  fee: number;
  maxSlots: number | null;
  status: EventStatus;
  coverImage: string | null;
  themeColor: string | null;
  paymentAccount: PaymentAccountSummary | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  organizations: EventOrg[];
}
