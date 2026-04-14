import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createProgramItemSchema } from '@/validations/program.schema';

function mapItem(item: {
  id: string;
  programId: string;
  day: number;
  type: string;
  session: string | null;
  order: number;
  title: string;
  description: string | null;
  time: string | null;
  churchId: string | null;
  church: { name: string } | null;
  presenterName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...item,
    churchName: item.church?.name ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

const ITEM_SELECT = {
  id: true,
  programId: true,
  day: true,
  type: true,
  session: true,
  order: true,
  title: true,
  description: true,
  time: true,
  churchId: true,
  church: { select: { name: true } },
  presenterName: true,
  createdAt: true,
  updatedAt: true,
};

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure program exists (auto-create if missing)
    let program = await prisma.eventProgram.findUnique({
      where: { eventId: params.id },
      select: { id: true },
    });
    if (!program) {
      const event = await prisma.event.findUnique({
        where: { id: params.id },
        select: { id: true },
      });
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      program = await prisma.eventProgram.create({
        data: { eventId: params.id, status: 'DRAFT', totalDays: 1 },
        select: { id: true },
      });
    }

    const body = await req.json();
    const parsed = createProgramItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Determine next order for this day
    const maxOrder = await prisma.programItem.aggregate({
      where: { programId: program.id, day: parsed.data.day },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const item = await prisma.programItem.create({
      data: {
        programId: program.id,
        day: parsed.data.day,
        type: parsed.data.type,
        session: parsed.data.session ?? null,
        order: nextOrder,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        time: parsed.data.time ?? null,
        churchId: parsed.data.churchId || null,
        presenterName: parsed.data.presenterName ?? null,
      },
      select: ITEM_SELECT,
    });

    return NextResponse.json({ data: mapItem(item) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create program item' }, { status: 500 });
  }
}
