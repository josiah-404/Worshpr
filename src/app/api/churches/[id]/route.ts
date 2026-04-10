import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateChurchSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

async function getChurchAndCheckOwnership(
  churchId: string,
  role: string,
  sessionOrgId: string | null | undefined,
) {
  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) return { church: null, allowed: false };
  if (role === 'super_admin') return { church, allowed: true };
  return { church, allowed: church.orgId === sessionOrgId };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role === 'officer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { church, allowed } = await getChurchAndCheckOwnership(id, session.user.role, session.user.orgId);
    if (!church) return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = updateChurchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.church.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        orgId: true,
        name: true,
        location: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { name: true } },
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        orgName: updated.organization.name,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update church' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role === 'officer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { church, allowed } = await getChurchAndCheckOwnership(id, session.user.role, session.user.orgId);
    if (!church) return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.church.delete({ where: { id } });

    return NextResponse.json({ data: { message: 'Church deleted' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete church' }, { status: 500 });
  }
}
