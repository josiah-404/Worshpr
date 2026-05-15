import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orgId: sessionOrgId, role } = session.user;
  const { eventId } = params;

  try {
    // Verify user belongs to an org involved in this event
    if (role !== 'super_admin') {
      const membership = await prisma.eventOrganization.findFirst({
        where: { eventId, orgId: sessionOrgId ?? '' },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let room = await prisma.chatRoom.findFirst({ where: { eventId } });

    if (!room) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          organizations: {
            where: { role: 'HOST' },
            select: { orgId: true },
          },
        },
      });

      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      const hostOrgId = event.organizations[0]?.orgId;
      if (!hostOrgId) {
        return NextResponse.json({ error: 'No host org found' }, { status: 400 });
      }

      try {
        room = await prisma.chatRoom.create({
          data: { name: event.title, type: 'EVENT', orgId: hostOrgId, eventId },
        });
      } catch {
        // Race condition: another request already created it
        room = await prisma.chatRoom.findFirst({ where: { eventId } });
        if (!room) {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      data: {
        id: room.id,
        name: room.name,
        type: room.type,
        orgId: room.orgId,
        eventId: room.eventId,
        createdAt: room.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
