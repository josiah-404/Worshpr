import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  assertCanManageOrg,
  canAccessOrg,
  isOfficer,
  OrgAccessError,
} from '@/lib/org-access';

const updateChurchSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isOfficer(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const church = await prisma.church.findUnique({ where: { id } });
    if (!church) return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    if (!canAccessOrg(session, church.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    assertCanManageOrg(session, church.orgId);

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
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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
    if (isOfficer(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const church = await prisma.church.findUnique({ where: { id } });
    if (!church) return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    if (!canAccessOrg(session, church.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    assertCanManageOrg(session, church.orgId);

    await prisma.church.delete({ where: { id } });

    return NextResponse.json({ data: { message: 'Church deleted' } }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to delete church' }, { status: 500 });
  }
}
