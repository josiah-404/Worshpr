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
        type: 'PASSWORD_RESET',
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId, type: 'PASSWORD_RESET' },
      });
    });

    return NextResponse.json(
      { data: { message: 'Password reset successfully. You can now log in.' } },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}
