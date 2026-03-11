import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setupPasswordSchema } from '@/validations/user.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = setupPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_SETUP',
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired setup link. Please contact your admin.' },
        { status: 400 },
      );
    }

    if (record.user.password) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => null);
      return NextResponse.json(
        { error: 'Password has already been set. Please log in or use Forgot Password.' },
        { status: 409 },
      );
    }

    const hashed = await hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashed, emailVerified: new Date() },
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId, type: 'PASSWORD_SETUP' },
      });
    });

    return NextResponse.json(
      { data: { message: 'Password set successfully. You can now log in.' } },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Setup password error:', err);
    return NextResponse.json({ error: 'Failed to set password. Please try again.' }, { status: 500 });
  }
}
