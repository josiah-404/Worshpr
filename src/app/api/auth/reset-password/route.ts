import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { setupPasswordSchema } from '@/validations/user.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = setupPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues },
        { status: 400 },
      );
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
        {
          status: 'error',
          message:
            'Invalid or expired reset token. Please request a new password reset link.',
        },
        { status: 400 },
      );
    }

    if (!record.user) {
      console.error('Token exists but user not found:', record.id);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Associated user account not found. Please contact support.',
        },
        { status: 404 },
      );
    }

    // User hasn't completed initial setup — shouldn't be resetting password
    if (!record.user.password) {
      await prisma.passwordResetToken
        .delete({ where: { id: record.id } })
        .catch((err) => console.error('Failed to delete token:', err));

      return NextResponse.json(
        {
          status: 'error',
          message:
            'Please complete your account setup first before resetting your password.',
        },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 12);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: record.userId },
          data: { password: hashed },
        });

        await tx.passwordResetToken.deleteMany({
          where: { userId: record.userId, type: 'PASSWORD_RESET' },
        });
      });
    } catch (txError) {
      console.error('Transaction failed during password reset:', txError);

      if (txError instanceof Prisma.PrismaClientKnownRequestError) {
        if (txError.code === 'P2025') {
          return NextResponse.json(
            {
              status: 'error',
              message: 'User account no longer exists.',
            },
            { status: 404 },
          );
        }
      }

      throw txError;
    }

    return NextResponse.json(
      {
        status: 'success',
        message:
          'Password reset successful. You can now log in with your new password.',
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to reset password. Please try again later.',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
