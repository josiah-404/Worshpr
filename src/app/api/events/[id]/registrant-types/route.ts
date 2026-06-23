import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { setRegistrantTypesSchema } from '@/validations/event.schema';

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

function mapRegistrantType(item: {
  id: string;
  label: string;
  order: number;
}) {
  return {
    id: item.id,
    label: item.label,
    order: item.order,
  };
}

// ─── GET /api/events/[id]/registrant-types ───────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, allowed } = await getEventAndCheckOwnership(
      params.id,
      session.user.role,
      session.user.orgId,
    );

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const items = await prisma.eventRegistrantType.findMany({
      where: { eventId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: items.map(mapRegistrantType) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch registrant types' }, { status: 500 });
  }
}

// ─── PUT /api/events/[id]/registrant-types ───────────────────────────────────

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
    const parsed = setRegistrantTypesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items } = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      await tx.eventRegistrantType.deleteMany({ where: { eventId: params.id } });
      if (items.length > 0) {
        await tx.eventRegistrantType.createMany({
          data: items.map((item, index) => ({
            eventId: params.id,
            label: item.label,
            order: index,
          })),
        });
      }
      return tx.eventRegistrantType.findMany({ where: { eventId: params.id }, orderBy: { order: 'asc' } });
    });

    return NextResponse.json({ data: created.map(mapRegistrantType) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update registrant types' }, { status: 500 });
  }
}
