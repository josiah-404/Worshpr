import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/validations/user.schema';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success regardless to prevent user enumeration
      return NextResponse.json(
        { data: { message: 'If an account exists, a reset link has been sent.' } },
        { status: 200 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            'Your account setup is incomplete. Check your inbox for the original setup email.',
        },
        { status: 403 },
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    try {
      await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, type: 'PASSWORD_RESET' },
      });

      await tx.passwordResetToken.create({
        data: { token, type: 'PASSWORD_RESET', userId: user.id, expires },
      });
    });

    return NextResponse.json(
      { data: { message: 'Password reset email sent. Please check your inbox.' } },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
