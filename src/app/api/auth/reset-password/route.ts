import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { TokenType } from '@/generated/prisma';
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

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    const { user } = resetToken;
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Account setup is not complete.' },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, type: 'PASSWORD_RESET' },
      }),
    ]);

    return NextResponse.json({ message: 'Password reset successfully.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
