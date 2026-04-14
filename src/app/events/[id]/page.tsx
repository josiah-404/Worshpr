import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventDetailClient } from './EventDetailClient';
import type { EventListItem, EventProgramData, ChurchOption, Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = (session.user?.role ?? 'officer') as 'super_admin' | 'org_admin' | 'officer';

  const [rawEvent, rawOrgs] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
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
        themeColor: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        paymentAccount: {
          select: {
            id: true, method: true, label: true, accountName: true,
            accountNumber: true, bankName: true, qrCodeUrl: true, instructions: true,
          },
        },
        organizations: {
          select: {
            id: true, orgId: true, role: true, inviteStatus: true,
            organization: { select: { name: true, logoUrl: true } },
          },
        },
        eventChurches: {
          select: {
            church: {
              select: {
                id: true, name: true, orgId: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
        program: {
          select: {
            id: true, eventId: true, status: true, totalDays: true,
            createdAt: true, updatedAt: true,
            items: {
              orderBy: [{ day: 'asc' }, { order: 'asc' }],
              select: {
                id: true, programId: true, day: true, type: true, session: true,
                order: true, title: true, description: true, time: true,
                churchId: true, church: { select: { name: true } },
                presenterName: true, createdAt: true, updatedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
    }),
  ]);

  if (!rawEvent) notFound();

  const event: EventListItem = {
    ...rawEvent,
    startDate: rawEvent.startDate.toISOString(),
    endDate: rawEvent.endDate.toISOString(),
    registrationDeadline: rawEvent.registrationDeadline?.toISOString() ?? null,
    createdAt: rawEvent.createdAt.toISOString(),
    updatedAt: rawEvent.updatedAt.toISOString(),
    organizations: rawEvent.organizations.map((o) => ({
      id: o.id,
      orgId: o.orgId,
      orgName: o.organization.name,
      orgLogoUrl: o.organization.logoUrl,
      role: o.role as 'HOST' | 'COLLABORATOR',
      inviteStatus: o.inviteStatus as 'PENDING' | 'ACCEPTED' | 'DECLINED',
    })),
  };

  const churches: ChurchOption[] = rawEvent.eventChurches.map((ec) => ({
    id: ec.church.id,
    name: ec.church.name,
    orgId: ec.church.orgId,
    orgName: ec.church.organization.name,
  }));

  const initialProgram: EventProgramData | null = rawEvent.program
    ? {
        id: rawEvent.program.id,
        eventId: rawEvent.program.eventId,
        status: rawEvent.program.status as EventProgramData['status'],
        totalDays: rawEvent.program.totalDays,
        createdAt: rawEvent.program.createdAt.toISOString(),
        updatedAt: rawEvent.program.updatedAt.toISOString(),
        items: rawEvent.program.items.map((item) => ({
          id: item.id,
          programId: item.programId,
          day: item.day,
          type: item.type as EventProgramData['items'][number]['type'],
          session: item.session as EventProgramData['items'][number]['session'],
          order: item.order,
          title: item.title,
          description: item.description,
          time: item.time,
          churchId: item.churchId,
          churchName: item.church?.name ?? null,
          presenterName: item.presenterName,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      }
    : null;

  const organizations: Organization[] = rawOrgs.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <EventDetailClient
      event={event}
      initialProgram={initialProgram}
      churches={churches}
      organizations={organizations}
      role={role}
    />
  );
}
