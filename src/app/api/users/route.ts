import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createUserSchema } from '@/validations/user.schema';
import { sendOnboardingEmail } from '@/lib/mail';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    const serialized = users.map((u) => ({ ...u, id: u.id.toString() }));
    return NextResponse.json({ data: serialized }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, role } = parsed.data;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Send email before writing to DB so a delivery failure doesn't leave a broken user
    try {
      await sendOnboardingEmail({ email, name, token });
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send onboarding email. Please try again.' },
        { status: 500 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, role },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });

      await tx.passwordResetToken.create({
        data: {
          token,
          type: 'PASSWORD_SETUP',
          userId: created.id,
          expires,
        },
      });

      return created;
    });

    return NextResponse.json({ data: { ...user, id: user.id.toString() } }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
