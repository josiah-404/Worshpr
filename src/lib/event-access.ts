import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isHostOrgAdmin } from '@/lib/org-access';

type EventWithOrgs = NonNullable<
  Awaited<ReturnType<typeof prisma.event.findUnique>>
> & {
  organizations: { orgId: string; role: string; inviteStatus: string }[];
};

export async function getEventHostAccess(
  session: Session,
  eventId: string,
): Promise<{ event: EventWithOrgs | null; allowed: boolean; hostOrgId: string | null }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizations: true },
  });

  if (!event) return { event: null, allowed: false, hostOrgId: null };

  const hostEntry = event.organizations.find((o) => o.role === 'HOST');
  const hostOrgId = hostEntry?.orgId ?? null;

  if (session.user.isSuperAdmin) {
    return { event, allowed: true, hostOrgId };
  }

  if (!hostOrgId) return { event, allowed: false, hostOrgId };

  return {
    event,
    allowed: isHostOrgAdmin(session, hostOrgId),
    hostOrgId,
  };
}

export function eventOrgFilterWhere(
  orgIds: string[] | undefined,
): { organizations: { some: { orgId: string | { in: string[] } } } } | undefined {
  if (!orgIds) return undefined;
  if (orgIds.length === 0) {
    return { organizations: { some: { orgId: { in: [] } } } };
  }
  if (orgIds.length === 1) {
    return { organizations: { some: { orgId: orgIds[0] } } };
  }
  return { organizations: { some: { orgId: { in: orgIds } } } };
}
