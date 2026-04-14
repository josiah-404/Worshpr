import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { inviteOrgSchema } from '@/validations/event.schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { organizations: true },
    });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only the HOST org admin (or super_admin) can invite others
    if (session.user.role !== 'super_admin') {
      const isHost = event.organizations.some(
        (o) => o.role === 'HOST' && o.orgId === session.user.orgId,
      );
      if (!isHost) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = inviteOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { orgId, role } = parsed.data;

    // Upsert: re-invite a previously declined org resets status to PENDING
    const invite = await prisma.eventOrganization.upsert({
      where: { eventId_orgId: { eventId: params.id, orgId } },
      create: {
        eventId: params.id,
        orgId,
        role,
        inviteStatus: 'PENDING',
        invitedBy: session.user.id,
      },
      update: {
        inviteStatus: 'PENDING',
        respondedAt: null,
        invitedBy: session.user.id,
      },
    });

    return NextResponse.json({ data: invite }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
