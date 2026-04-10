import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getEventAndCheckOwnership(
  eventId: string,
  role: string,
  userOrgId: string | null | undefined,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      organizations: {
        where: { inviteStatus: 'ACCEPTED' },
        select: { orgId: true, role: true },
      },
    },
  });

  if (!event) return { event: null, allowed: false };
  if (role === 'super_admin') return { event, allowed: true };

  const isHost = event.organizations.some(
    (o) => o.role === 'HOST' && o.orgId === userOrgId,
  );

  return { event, allowed: isHost };
}

function mapChurch(c: {
  id: string;
  orgId: string;
  name: string;
  location: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: { name: string };
}) {
  return {
    id: c.id,
    orgId: c.orgId,
    orgName: c.organization.name,
    name: c.name,
    location: c.location,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ─── GET /api/events/[id]/churches ──────────────────────────────────────────

export async function GET(
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
      session.user.role,
      session.user.orgId,
    );

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // All org IDs that are ACCEPTED for this event
    const acceptedOrgIds = event.organizations.map((o) => o.orgId);

    // Churches already participating in this event
    const participating = await prisma.church.findMany({
      where: { eventChurches: { some: { eventId: params.id } } },
      orderBy: [{ orgId: 'asc' }, { name: 'asc' }],
      select: {
        id: true, orgId: true, name: true, location: true,
        isActive: true, createdAt: true, updatedAt: true,
        organization: { select: { name: true } },
      },
    });

    const participatingIds = participating.map((c) => c.id);

    // All active churches from the event's accepted orgs, excluding those already participating
    const available = await prisma.church.findMany({
      where: {
        orgId: { in: acceptedOrgIds },
        isActive: true,
        id: { notIn: participatingIds },
      },
      orderBy: [{ orgId: 'asc' }, { name: 'asc' }],
      select: {
        id: true, orgId: true, name: true, location: true,
        isActive: true, createdAt: true, updatedAt: true,
        organization: { select: { name: true } },
      },
    });

    return NextResponse.json({
      data: {
        participating: participating.map(mapChurch),
        available: available.map(mapChurch),
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch event churches' }, { status: 500 });
  }
}

// ─── PUT /api/events/[id]/churches ──────────────────────────────────────────

const putSchema = z.object({
  churchIds: z.array(z.string()).min(0),
});

export async function PUT(
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
      session.user.role,
      session.user.orgId,
    );

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { churchIds } = parsed.data;

    // Replace all EventChurch records for this event in a transaction
    await prisma.$transaction([
      prisma.eventChurch.deleteMany({ where: { eventId: params.id } }),
      ...(churchIds.length > 0
        ? [
            prisma.eventChurch.createMany({
              data: churchIds.map((churchId) => ({ eventId: params.id, churchId })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ data: { message: 'Churches updated' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update event churches' }, { status: 500 });
  }
}
