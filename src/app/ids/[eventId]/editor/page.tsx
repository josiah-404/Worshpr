import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { IdEditorClient } from './IdEditorClient';
import type { IdTemplateRecord } from '@/types/id.types';

export const dynamic = 'force-dynamic';

export default async function IdEditorPage({
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
      idTemplate: true,
    },
  });

  if (!event) redirect('/ids');

  const registrations = await prisma.registration.findMany({
    where: { eventId, status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
    select: {
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

  const template: IdTemplateRecord | null = event.idTemplate
    ? {
        id: event.idTemplate.id,
        eventId: event.idTemplate.eventId,
        backgroundUrl: event.idTemplate.backgroundUrl,
        sizeId: event.idTemplate.sizeId,
        layoutId: event.idTemplate.layoutId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layoutFields: event.idTemplate.layoutFields as any,
        overlayColor: event.idTemplate.overlayColor ?? '#000000',
        textColor: event.idTemplate.textColor ?? '#ffffff',
        fontFamily: event.idTemplate.fontFamily ?? 'Poppins',
        createdAt: event.idTemplate.createdAt.toISOString(),
        updatedAt: event.idTemplate.updatedAt.toISOString(),
      }
    : null;

  return (
    <IdEditorClient
      event={{ id: event.id, title: event.title }}
      initialTemplate={template}
      registrants={registrants}
    />
  );
}
