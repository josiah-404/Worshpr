import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventsGrid } from './EventsGrid';
import type { EventListItem, Organization, OrgRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role ?? 'officer') as OrgRole;
  const userOrgId = session?.user?.orgId ?? null;

  const isSuperAdmin = role === 'super_admin';

  // Fetch events — super_admin gets all, others get their org's events
  const rawEvents = await prisma.event.findMany({
    where: isSuperAdmin
      ? undefined
      : userOrgId
        ? { organizations: { some: { orgId: userOrgId } } }
        : { id: 'none' }, // no org = no events
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      venue: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      fee: true,
      maxSlots: true,
      status: true,
      coverImage: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      organizations: {
        select: {
          id: true,
          orgId: true,
          role: true,
          inviteStatus: true,
          organization: { select: { name: true, logoUrl: true } },
        },
      },
    },
  });

  const events: EventListItem[] = rawEvents.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    registrationDeadline: e.registrationDeadline?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    organizations: e.organizations.map((o) => ({
      id: o.id,
      orgId: o.orgId,
      orgName: o.organization.name,
      orgLogoUrl: o.organization.logoUrl,
      role: o.role as 'HOST' | 'COLLABORATOR',
      inviteStatus: o.inviteStatus as 'PENDING' | 'ACCEPTED' | 'DECLINED',
    })),
  }));

  // Fetch organizations for the EventDialog + EventInvitePanel
  const rawOrgs = await prisma.organization.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
  });

  const organizations: Organization[] = rawOrgs.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Events</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage camps, fellowships, seminars, and worship nights
        </p>
      </div>
      <EventsGrid
        initialEvents={events}
        role={role}
        organizations={organizations}
      />
    </div>
  );
}
