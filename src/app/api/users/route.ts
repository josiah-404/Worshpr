import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TokenType } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listUsers } from '@/lib/user-list';
import { createUserSchema } from '@/validations/user.schema';
import { sendOnboardingEmail } from '@/lib/mail';
import {
  assertCanManageOrg,
  assertCanManageUsers,
  getManageableOrgIds,
  OrgAccessError,
} from '@/lib/org-access';
import { serializeUser, userSelect } from '@/lib/user-serialize';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCanManageUsers(session);

    const manageableOrgIds = getManageableOrgIds(session);
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('page_size') ?? '10', 10)),
    );
    const query = searchParams.get('query') ?? '';

    const result = await listUsers({
      manageableOrgIds,
      page,
      pageSize,
      query,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCanManageUsers(session);

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, isSuperAdmin, memberships } = parsed.data;

    if (isSuperAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    for (const m of memberships) {
      assertCanManageOrg(session, m.orgId);
      if (!session.user.isSuperAdmin && m.role === 'org_admin') {
        const actorMembership = session.user.orgMemberships.find(
          (am) => am.orgId === m.orgId,
        );
        if (actorMembership?.role !== 'org_admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const setupUrl = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`;

    await sendOnboardingEmail(email, name, setupUrl);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
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

      await tx.passwordResetToken.create({
        data: {
          userId: created.id,
          token,
          type: TokenType.PASSWORD_SETUP,
          expires,
        },
      });

      return created;
    });

    return NextResponse.json({ data: serializeUser(user) }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
