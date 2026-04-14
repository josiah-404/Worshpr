import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProgramItemSchema } from '@/validations/program.schema';

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

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.programItem.findUnique({
      where: { id: params.itemId },
      select: { programId: true, program: { select: { eventId: true } } },
    });
    if (!existing || existing.program.eventId !== params.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateProgramItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const item = await prisma.programItem.update({
      where: { id: params.itemId },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.time !== undefined && { time: parsed.data.time }),
        ...(parsed.data.churchId !== undefined && { churchId: parsed.data.churchId || null }),
        ...(parsed.data.presenterName !== undefined && { presenterName: parsed.data.presenterName }),
        ...(parsed.data.session !== undefined && { session: parsed.data.session }),
        ...(parsed.data.day !== undefined && { day: parsed.data.day }),
      },
      select: ITEM_SELECT,
    });

    return NextResponse.json({ data: mapItem(item) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update program item' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.programItem.findUnique({
      where: { id: params.itemId },
      select: { program: { select: { eventId: true } } },
    });
    if (!existing || existing.program.eventId !== params.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.programItem.delete({ where: { id: params.itemId } });

    return NextResponse.json({ data: { message: 'Item deleted' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete program item' }, { status: 500 });
  }
}
