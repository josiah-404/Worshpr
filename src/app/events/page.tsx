import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveFilterOrgIds } from '@/lib/org-access';
import { eventOrgFilterWhere } from '@/lib/event-access';
import { EventsGrid } from './EventsGrid';
import type { EventListItem, Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const filterOrgIds = session ? resolveFilterOrgIds(session) : [];

  const rawEvents = await prisma.event.findMany({
    where: eventOrgFilterWhere(filterOrgIds),
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      customType: true,
      venue: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      maxSlots: true,
      status: true,
      coverImage: true,
      themeColor: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      paymentAccount: {
        select: {
          id: true,
          method: true,
          label: true,
          accountName: true,
          accountNumber: true,
          bankName: true,
          qrCodeUrl: true,
          instructions: true,
        },
      },
      organizations: {
        select: {
          id: true,
          orgId: true,
          role: true,
          inviteStatus: true,
          organization: { select: { name: true, logoUrl: true } },
        },
      },
      feeItems: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, amount: true, isRequired: true, order: true },
      },
      registrantTypes: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, order: true },
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
        organizations={organizations}
      />
    </div>
  );
}
