import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEventHostAccess } from '@/lib/event-access';
import { isOfficer, OrgAccessError } from '@/lib/org-access';
import { z } from 'zod';

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isOfficer(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const acceptedOrgIds = event.organizations
      .filter((o) => o.inviteStatus === 'ACCEPTED')
      .map((o) => o.orgId);

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
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch event churches' }, { status: 500 });
  }
}

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
    if (isOfficer(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { churchIds } = parsed.data;

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
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update event churches' }, { status: 500 });
  }
}
