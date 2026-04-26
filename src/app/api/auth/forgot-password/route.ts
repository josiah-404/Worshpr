import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TokenType } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to avoid email enumeration
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' }, { status: 200 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Account setup is not complete. Please check your onboarding email.' },
        { status: 403 },
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, type: TokenType.PASSWORD_RESET },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, token, type: TokenType.PASSWORD_RESET, expires },
      }),
    ]);

    await sendPasswordResetEmail(email, user.name, resetUrl);

    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
