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

    const setupToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_SETUP,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!setupToken) {
      return NextResponse.json({ error: 'Invalid or expired setup link.' }, { status: 400 });
    }

    const { user } = setupToken;
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: 'Password has already been set. Use forgot password instead.' },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, emailVerified: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, type: 'PASSWORD_SETUP' },
      }),
    ]);

    return NextResponse.json({ message: 'Password set successfully. You can now sign in.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
