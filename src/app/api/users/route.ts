import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TokenType } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUserSchema } from '@/validations/user.schema';
import { sendOnboardingEmail } from '@/lib/mail';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = session.user.role === 'org_admin' && session.user.orgId
      ? { orgId: session.user.orgId }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });
    const serialized = users.map(({ password, ...u }) => ({
      ...u,
      id: u.id.toString(),
      isSetup: password !== null,
    }));
    return NextResponse.json({ data: serialized }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, role, orgId, title } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const setupUrl = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`;

    // Send email before writing to DB — delivery failure won't leave a broken user
    await sendOnboardingEmail(email, name, setupUrl);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          role,
          orgId: role === 'super_admin' ? null : (orgId || null),
          title: title ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          orgId: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          password: true,
        },
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

    const { password: _pw, ...userWithoutPassword } = user;
    return NextResponse.json({ data: { ...userWithoutPassword, id: user.id.toString(), isSetup: false } }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
