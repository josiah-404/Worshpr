import type { OrgMembership, OrgMembershipRole } from '@/types/org.types';

interface DbMembership {
  orgId: string;
  role: string;
  title: string | null;
}

interface SessionOrgFields {
  isSuperAdmin: boolean;
  orgMemberships: OrgMembership[];
  activeOrgId: string | null;
  activeRole: OrgMembershipRole | 'super_admin' | null;
  activeTitle: string | null;
}

export function mapDbMemberships(memberships: DbMembership[]): OrgMembership[] {
  return memberships.map((m) => ({
    orgId: m.orgId,
    role: m.role as OrgMembershipRole,
    title: m.title,
  }));
}

export function resolveActiveMembership(
  memberships: OrgMembership[],
  activeOrgId: string | null,
): OrgMembership | null {
  if (!activeOrgId) return memberships[0] ?? null;
  return memberships.find((m) => m.orgId === activeOrgId) ?? memberships[0] ?? null;
}

export function buildSessionOrgFields(
  isSuperAdmin: boolean,
  memberships: OrgMembership[],
  activeOrgId?: string | null,
): SessionOrgFields {
  const defaultActiveOrgId = isSuperAdmin
    ? (activeOrgId ?? null)
    : (activeOrgId ?? memberships[0]?.orgId ?? null);

  if (isSuperAdmin) {
    return {
      isSuperAdmin: true,
      orgMemberships: memberships,
      activeOrgId: defaultActiveOrgId,
      activeRole: 'super_admin',
      activeTitle: null,
    };
  }

  const active = resolveActiveMembership(memberships, defaultActiveOrgId);

  return {
    isSuperAdmin: false,
    orgMemberships: memberships,
    activeOrgId: active?.orgId ?? null,
    activeRole: active?.role ?? null,
    activeTitle: active?.title ?? null,
  };
}

export function applyActiveOrgUpdate(
  isSuperAdmin: boolean,
  memberships: OrgMembership[],
  newActiveOrgId: string | null,
): SessionOrgFields {
  return buildSessionOrgFields(isSuperAdmin, memberships, newActiveOrgId);
}
