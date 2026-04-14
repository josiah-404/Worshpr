import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertProgramSchema } from '@/validations/program.schema';

const PROGRAM_SELECT = {
  id: true,
  eventId: true,
  status: true,
  totalDays: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: [{ day: 'asc' as const }, { order: 'asc' as const }],
    select: {
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
    },
  },
};

function mapProgram(raw: {
  id: string;
  eventId: string;
  status: string;
  totalDays: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
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
  }[];
}) {
  return {
    ...raw,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    items: raw.items.map((item) => ({
      ...item,
      churchName: item.church?.name ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const program = await prisma.eventProgram.findUnique({
      where: { eventId: params.id },
      select: PROGRAM_SELECT,
    });

    return NextResponse.json({ data: program ? mapProgram(program) : null }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

// ─── PUT (upsert) ─────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const body = await req.json();
    const parsed = upsertProgramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const program = await prisma.eventProgram.upsert({
      where: { eventId: params.id },
      create: {
        eventId: params.id,
        status: parsed.data.status ?? 'DRAFT',
        totalDays: parsed.data.totalDays ?? 1,
      },
      update: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.totalDays !== undefined && { totalDays: parsed.data.totalDays }),
      },
      select: PROGRAM_SELECT,
    });

    return NextResponse.json({ data: mapProgram(program) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save program' }, { status: 500 });
  }
}
