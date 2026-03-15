import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventsGrid } from '@/app/events/EventsGrid';
import type { Event } from '@/types/event.types';
import type { Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const orgId = session?.user?.orgId ?? null;

  const eventWhere =
    role === 'super_admin' ? undefined : orgId ? { orgId } : { orgId: '' };

  const orgWhere =
    role === 'super_admin'
      ? { isActive: true }
      : orgId
        ? { isActive: true, id: orgId }
        : { isActive: true, id: '' };

  const [rawEvents, rawOrgs] = await Promise.all([
    prisma.event.findMany({
      where: eventWhere,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.organization.findMany({
      where: orgWhere,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const events: Event[] = rawEvents.map((e) => ({
    id: e.id,
    orgId: e.orgId,
    theme: e.theme,
    description: e.description,
    type: e.type as Event['type'],
    venue: e.venue,
    isOngoing: e.isOngoing,
    isOpen: e.isOpen,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    registrationDeadline: e.registrationDeadline?.toISOString() ?? null,
    registrationFee: e.registrationFee,
    maxSlots: e.maxSlots,
    status: e.status as Event['status'],
    coverImageUrl: e.coverImageUrl,
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    _count: e._count,
  }));

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
          Manage camps, fellowships, and seminars
        </p>
      </div>
      <EventsGrid initialEvents={events} organizations={organizations} />
    </div>
  );
}
