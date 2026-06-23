import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserSchema } from '@/validations/user.schema';
import {
  assertCanManageOrg,
  assertCanManageUsers,
  getManageableOrgIds,
  OrgAccessError,
} from '@/lib/org-access';
import { serializeUser, userSelect } from '@/lib/user-serialize';

async function canManageTargetUser(
  session: Session,
  targetUserId: string,
): Promise<boolean> {
  if (session.user.isSuperAdmin) return true;

  const manageableOrgIds = getManageableOrgIds(session) ?? [];
  if (manageableOrgIds.length === 0) return false;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isSuperAdmin: true, memberships: { select: { orgId: true } } },
  });

  if (!target) return false;
  if (target.isSuperAdmin) return false;

  return target.memberships.some((m) => manageableOrgIds.includes(m.orgId));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCanManageUsers(session);

    const canManage = await canManageTargetUser(session, params.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, isSuperAdmin, memberships } = parsed.data;

    if (isSuperAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    for (const m of memberships) {
      assertCanManageOrg(session, m.orgId);
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.userOrganization.deleteMany({
        where: { userId: params.id },
      });

      return tx.user.update({
        where: { id: params.id },
        data: {
          name,
          email,
          isSuperAdmin,
          memberships: isSuperAdmin
            ? undefined
            : {
                create: memberships.map((m) => ({
                  orgId: m.orgId,
                  role: m.role,
                  title: m.role === 'officer' ? (m.title ?? null) : null,
                })),
              },
        },
        select: userSelect,
      });
    });

    return NextResponse.json({ data: serializeUser(user) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCanManageUsers(session);

    const canManage = await canManageTargetUser(session, params.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { message: 'User deleted' } }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
