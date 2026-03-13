import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateOrganizationSchema } from '@/validations/organization.schema';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, logoUrl, isActive } = parsed.data;
    const data: Record<string, unknown> = { name };
    if (logoUrl !== undefined) data.logoUrl = logoUrl || null;
    if (isActive !== undefined) data.isActive = isActive;

    const organization = await prisma.organization.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: organization }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.organization.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { message: 'Organization deleted' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}
