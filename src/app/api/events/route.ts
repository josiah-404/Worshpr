import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEventSchema } from '@/validations/event.schema';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    const orgId = session.user.orgId;

    const where =
      role === 'super_admin'
        ? undefined
        : orgId
          ? { orgId }
          : { orgId: '' }; // no org = no results

    const raw = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });

    const data = raw.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      registrationDeadline: e.registrationDeadline?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/events]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role === 'officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse({
      ...body,
      createdBy: session.user.id,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { startDate, endDate, registrationDeadline, ...rest } = parsed.data;

    const event = await prisma.event.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxSlots: rest.maxSlots ?? null,
      },
      include: { _count: { select: { registrations: true } } },
    });

    const data = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/events]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
