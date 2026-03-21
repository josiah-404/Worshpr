import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateEventSchema } from '@/validations/event.schema';

async function getEventAndCheckOwnership(
  eventId: string,
  userId: string,
  role: string,
  userOrgId: string | null | undefined,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizations: true },
  });

  if (!event) return { event: null, allowed: false };

  if (role === 'super_admin') return { event, allowed: true };

  const hostEntry = event.organizations.find(
    (o) => o.role === 'HOST' && o.orgId === userOrgId,
  );

  return { event, allowed: !!hostEntry };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role === 'officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, allowed } = await getEventAndCheckOwnership(
      params.id,
      session.user.id,
      session.user.role,
      session.user.orgId,
    );

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { coverImage, registrationDeadline, maxSlots, startDate, endDate, ...rest } =
      parsed.data;

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(registrationDeadline !== undefined
          ? { registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null }
          : {}),
        ...(maxSlots !== undefined ? { maxSlots: maxSlots ?? null } : {}),
        ...(coverImage !== undefined ? { coverImage: coverImage || null } : {}),
      },
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

    const data = {
      ...updated,
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate.toISOString(),
      registrationDeadline: updated.registrationDeadline?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      organizations: updated.organizations.map((o) => ({
        id: o.id,
        orgId: o.orgId,
        orgName: o.organization.name,
        orgLogoUrl: o.organization.logoUrl,
        role: o.role,
        inviteStatus: o.inviteStatus,
      })),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role === 'officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, allowed } = await getEventAndCheckOwnership(
      params.id,
      session.user.id,
      session.user.role,
      session.user.orgId,
    );

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { message: 'Event deleted' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
