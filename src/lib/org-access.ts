import type { Session } from 'next-auth';
import type { OrgMembershipRole } from '@/types/org.types';

export class OrgAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'OrgAccessError';
  }
}

type AppSession = Session & {
  user: Session['user'] & {
    isSuperAdmin: boolean;
    orgMemberships: { orgId: string; role: OrgMembershipRole; title: string | null }[];
    activeOrgId: string | null;
    activeRole: OrgMembershipRole | 'super_admin' | null;
    activeTitle: string | null;
  };
};

function asAppSession(session: Session | null): AppSession | null {
  if (!session?.user) return null;
  return session as AppSession;
}

export function getAccessibleOrgIds(session: Session | null): string[] | null {
  const appSession = asAppSession(session);
  if (!appSession) return [];

  if (appSession.user.isSuperAdmin) return null;

  return appSession.user.orgMemberships.map((m) => m.orgId);
}

export function resolveFilterOrgId(
  session: Session | null,
  queryOrgId?: string | null,
): string | undefined {
  const appSession = asAppSession(session);
  if (!appSession) return undefined;

  if (appSession.user.isSuperAdmin) {
    return queryOrgId ?? appSession.user.activeOrgId ?? undefined;
  }

  const accessible = getAccessibleOrgIds(session) ?? [];

  if (queryOrgId) {
    if (!accessible.includes(queryOrgId)) {
      throw new OrgAccessError('Forbidden', 403);
    }
    return queryOrgId;
  }

  if (accessible.length === 1) return accessible[0];

  return appSession.user.activeOrgId ?? undefined;
}

export function resolveFilterOrgIds(
  session: Session | null,
  queryOrgId?: string | null,
): string[] | undefined {
  const appSession = asAppSession(session);
  if (!appSession) return [];

  if (appSession.user.isSuperAdmin) {
    const single = queryOrgId ?? appSession.user.activeOrgId ?? undefined;
    return single ? [single] : undefined;
  }

  const accessible = getAccessibleOrgIds(session) ?? [];

  if (queryOrgId) {
    if (!accessible.includes(queryOrgId)) {
      throw new OrgAccessError('Forbidden', 403);
    }
    return [queryOrgId];
  }

  if (accessible.length === 0) return [];

  const activeOrgId = appSession.user.activeOrgId;
  if (activeOrgId && accessible.includes(activeOrgId)) {
    return [activeOrgId];
  }

  return accessible;
}

export function assertCanAccessOrg(session: Session | null, orgId: string): void {
  const appSession = asAppSession(session);
  if (!appSession) throw new OrgAccessError('Unauthorized', 401);
  if (appSession.user.isSuperAdmin) return;

  const accessible = getAccessibleOrgIds(session) ?? [];
  if (!accessible.includes(orgId)) {
    throw new OrgAccessError('Forbidden', 403);
  }
}

export function assertCanManageOrg(session: Session | null, orgId: string): void {
  const appSession = asAppSession(session);
  if (!appSession) throw new OrgAccessError('Unauthorized', 401);
  if (appSession.user.isSuperAdmin) return;

  const membership = appSession.user.orgMemberships.find((m) => m.orgId === orgId);
  if (!membership || membership.role !== 'org_admin') {
    throw new OrgAccessError('Forbidden', 403);
  }
}

export function getManageableOrgIds(session: Session | null): string[] | null {
  const appSession = asAppSession(session);
  if (!appSession) return [];
  if (appSession.user.isSuperAdmin) return null;

  return appSession.user.orgMemberships
    .filter((m) => m.role === 'org_admin')
    .map((m) => m.orgId);
}

export function assertCanManageUsers(session: Session | null): void {
  const appSession = asAppSession(session);
  if (!appSession) throw new OrgAccessError('Unauthorized', 401);
  if (appSession.user.isSuperAdmin) return;

  const manageable = getManageableOrgIds(session) ?? [];
  if (manageable.length === 0) {
    throw new OrgAccessError('Forbidden', 403);
  }
}

export function isOfficer(session: Session | null): boolean {
  const appSession = asAppSession(session);
  if (!appSession) return false;
  if (appSession.user.isSuperAdmin) return false;
  return appSession.user.activeRole === 'officer';
}

export function isOrgAdmin(session: Session | null): boolean {
  const appSession = asAppSession(session);
  if (!appSession) return false;
  if (appSession.user.isSuperAdmin) return true;
  return appSession.user.activeRole === 'org_admin';
}

export function orgIdWhereClause(
  session: Session | null,
  queryOrgId?: string | null,
): { orgId: string } | { orgId: { in: string[] } } | undefined {
  const ids = resolveFilterOrgIds(session, queryOrgId);
  if (ids === undefined) return undefined;
  if (ids.length === 0) return { orgId: { in: [] } };
  if (ids.length === 1) return { orgId: ids[0] };
  return { orgId: { in: ids } };
}

export function canAccessOrg(session: Session | null, orgId: string): boolean {
  const appSession = asAppSession(session);
  if (!appSession) return false;
  if (appSession.user.isSuperAdmin) return true;
  return appSession.user.orgMemberships.some((m) => m.orgId === orgId);
}

export function isHostOrgAdmin(session: Session | null, hostOrgId: string): boolean {
  const appSession = asAppSession(session);
  if (!appSession) return false;
  if (appSession.user.isSuperAdmin) return true;
  const membership = appSession.user.orgMemberships.find((m) => m.orgId === hostOrgId);
  return membership?.role === 'org_admin';
}

export function canManageFinance(session: Session | null): boolean {
  const appSession = asAppSession(session);
  if (!appSession) return false;
  if (appSession.user.isSuperAdmin) return true;
  if (appSession.user.activeRole === 'org_admin') return true;
  if (
    appSession.user.activeRole === 'officer' &&
    appSession.user.activeTitle === 'Treasurer'
  ) {
    return true;
  }
  return false;
}

export function assertCanManageFinance(session: Session | null): void {
  if (!canManageFinance(session)) {
    throw new OrgAccessError('Forbidden', 403);
  }
}
