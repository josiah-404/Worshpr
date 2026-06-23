import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEventHostAccess } from '@/lib/event-access';
import { isOfficer, OrgAccessError } from '@/lib/org-access';
import { setFeeItemsSchema } from '@/validations/event.schema';

function mapFeeItem(item: {
  id: string;
  label: string;
  amount: number;
  isRequired: boolean;
  order: number;
}) {
  return {
    id: item.id,
    label: item.label,
    amount: item.amount,
    isRequired: item.isRequired,
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

    const items = await prisma.eventFeeItem.findMany({
      where: { eventId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: items.map(mapFeeItem) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch fee items' }, { status: 500 });
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
    const parsed = setFeeItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items } = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      await tx.eventFeeItem.deleteMany({ where: { eventId: params.id } });
      if (items.length > 0) {
        await tx.eventFeeItem.createMany({
          data: items.map((item, index) => ({
            eventId: params.id,
            label: item.label,
            amount: item.amount,
            isRequired: item.isRequired,
            order: index,
          })),
        });
      }
      return tx.eventFeeItem.findMany({ where: { eventId: params.id }, orderBy: { order: 'asc' } });
    });

    return NextResponse.json({ data: created.map(mapFeeItem) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update fee items' }, { status: 500 });
  }
}
