import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEventHostAccess } from '@/lib/event-access';
import { isOfficer, OrgAccessError } from '@/lib/org-access';
import { setRegistrantTypesSchema } from '@/validations/event.schema';

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const items = await prisma.eventRegistrantType.findMany({
      where: { eventId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: items.map(mapRegistrantType) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch registrant types' }, { status: 500 });
  }
}

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
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update registrant types' }, { status: 500 });
  }
}
