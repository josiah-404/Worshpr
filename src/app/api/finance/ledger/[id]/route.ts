import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateLedgerEntrySchema } from '@/validations/finance.schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const parsed = updateLedgerEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.financeLedger.findUnique({
      where: { id },
      select: { orgId: true, referenceId: true },
    });

    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (session.user.role !== 'super_admin' && existing.orgId !== session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Auto-created registration entries should not be manually edited
    if (existing.referenceId) {
      return NextResponse.json({ error: 'Auto-generated entries cannot be edited' }, { status: 400 });
    }

    const { date, eventId, ...rest } = parsed.data;
    const updated = await prisma.financeLedger.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        ...(eventId !== undefined ? { eventId: eventId || null } : {}),
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: { ...updated, updatedAt: updated.updatedAt.toISOString() },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.financeLedger.findUnique({
      where: { id },
      select: { orgId: true, referenceId: true },
    });

    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (session.user.role !== 'super_admin' && existing.orgId !== session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existing.referenceId) {
      return NextResponse.json({ error: 'Auto-generated entries cannot be deleted' }, { status: 400 });
    }

    await prisma.financeLedger.delete({ where: { id } });
    return NextResponse.json({ data: { id } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
