import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { IdsRegistrantsClient } from './IdsRegistrantsClient';

export const dynamic = 'force-dynamic';

export default async function IdsEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      type: true,
      idTemplate: { select: { sizeId: true, layoutId: true, backgroundUrl: true, layoutFields: true } },
    },
  });

  if (!event) redirect('/ids');

  const registrations = await prisma.registration.findMany({
    where: { eventId, status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      registrant: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          photoUrl: true,
          churchRef: { select: { name: true } },
          divisionOrg: { select: { name: true } },
        },
      },
      group: { select: { confirmationCode: true } },
    },
  });

  const registrants = registrations.map((r) => ({
    id: r.registrant.id,
    fullName: r.registrant.fullName,
    nickname: r.registrant.nickname,
    photoUrl: r.registrant.photoUrl,
    churchName: r.registrant.churchRef?.name ?? null,
    divisionOrgName: r.registrant.divisionOrg?.name ?? null,
    confirmationCode: r.group.confirmationCode,
  }));

  return (
    <IdsRegistrantsClient
      event={{ id: event.id, title: event.title }}
      registrants={registrants}
      hasTemplate={!!event.idTemplate}
    />
  );
}
