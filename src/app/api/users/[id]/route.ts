import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUserSchema } from '@/validations/user.schema';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, role, orgId, title } = parsed.data;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        orgId: role === 'super_admin' ? null : (orgId ?? null),
        title: role === 'officer' ? (title ?? null) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgId: true,
        title: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { password: _pw, ...userWithoutPassword } = user;
    return NextResponse.json({
      data: { ...userWithoutPassword, isSetup: _pw !== null },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { message: 'User deleted' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
