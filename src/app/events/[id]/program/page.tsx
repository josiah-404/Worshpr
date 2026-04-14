import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProgramClient } from './ProgramClient';
import type { EventProgramData, ChurchOption, EventDetails } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function ProgramPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      type: true,
      description: true,
      venue: true,
      startDate: true,
      endDate: true,
      organizations: {
        where: { inviteStatus: 'ACCEPTED' },
        select: {
          role: true,
          organization: { select: { name: true } },
        },
      },
      eventChurches: {
        select: {
          church: {
            select: {
              id: true,
              name: true,
              orgId: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
      program: {
        select: {
          id: true,
          eventId: true,
          status: true,
          totalDays: true,
          createdAt: true,
          updatedAt: true,
          items: {
            orderBy: [{ day: 'asc' }, { order: 'asc' }],
            select: {
              id: true,
              programId: true,
              day: true,
              type: true,
              session: true,
              order: true,
              title: true,
              description: true,
              time: true,
              churchId: true,
              church: { select: { name: true } },
              presenterName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const churches: ChurchOption[] = event.eventChurches.map((ec) => ({
    id: ec.church.id,
    name: ec.church.name,
    orgId: ec.church.orgId,
    orgName: ec.church.organization.name,
  }));

  const eventDetails: EventDetails = {
    venue: event.venue ?? null,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    description: event.description ?? null,
    organizations: event.organizations.map((o) => ({
      name: o.organization.name,
      role: o.role,
    })),
  };

  const initialProgram: EventProgramData | null = event.program
    ? {
        id: event.program.id,
        eventId: event.program.eventId,
        status: event.program.status as EventProgramData['status'],
        totalDays: event.program.totalDays,
        createdAt: event.program.createdAt.toISOString(),
        updatedAt: event.program.updatedAt.toISOString(),
        items: event.program.items.map((item) => ({
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

  return (
    <div className="space-y-6">
      <ProgramClient
        eventId={event.id}
        eventTitle={event.title}
        eventType={event.type}
        initialProgram={initialProgram}
        churches={churches}
        eventDetails={eventDetails}
      />
    </div>
  );
}
