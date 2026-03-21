import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondInviteSchema } from '@/validations/event.schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; orgId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the invited org's admin (or super_admin) can respond
    if (
      session.user.role !== 'super_admin' &&
      session.user.orgId !== params.orgId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invite = await prisma.eventOrganization.findUnique({
      where: { eventId_orgId: { eventId: params.id, orgId: params.orgId } },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.inviteStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invite has already been responded to' },
        { status: 409 },
      );
    }

    const body = await req.json();
    const parsed = respondInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.eventOrganization.update({
      where: { eventId_orgId: { eventId: params.id, orgId: params.orgId } },
      data: {
        inviteStatus: parsed.data.status,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to respond to invite' }, { status: 500 });
  }
}
