import type { SongResult } from '@/types/worship.types';

export type { EventType, EventStatus, EventOrgRole, EventInviteStatus, EventOrg, EventListItem, CollaborationInvite } from '@/types/event.types';

export type OrgRole = 'super_admin' | 'org_admin' | 'officer';

export interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Organization row as returned by the list query (includes member count). */
export interface OrganizationRow extends Organization {
  _count: { users: number };
}

export interface OrganizationFormState {
  name: string;
  logoUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  orgId: string | null;
  title: string | null;
  createdAt: string;
}

export interface UserFormState {
  name: string;
  email: string;
  role: OrgRole;
  password: string;
  orgId: string;
  title: string;
}

export interface Presentation {
  id: string;
  title: string;
  lyrics: string;
  songQueue: SongResult[];
  bgId: string;
  transitionId: string;
  fontId: string;
  sizeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSearchQuotaRecord {
  used: number;
  limit: number;
  remaining: number;
  date: string;
}
