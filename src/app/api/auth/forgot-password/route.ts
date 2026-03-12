import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide a valid email address.',
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Return error if user doesn't exist
    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No account found with this email address.',
        },
        { status: 404 },
      );
    }

    // Check if user has completed account setup (emailVerified is set by setup-password)
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Please complete your account setup first before resetting your password. Check your email for the verification link.',
        },
        { status: 403 },
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      // Return error response if email fails
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Failed to send password reset email. Please try again later or contact support.',
          error:
            emailError instanceof Error
              ? emailError.message
              : 'Email service error',
        },
        { status: 500 },
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Delete old PASSWORD_RESET tokens for this user
        await tx.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            type: 'PASSWORD_RESET',
          },
        });

        // Create a new password reset token
        await tx.passwordResetToken.create({
          data: {
            token,
            type: 'PASSWORD_RESET',
            userId: user.id,
            expires,
          },
        });
      });
    } catch (txError) {
      console.error('Failed to create new reset token:', txError);

      if (txError instanceof Prisma.PrismaClientKnownRequestError) {
        // User not found during update
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

      return NextResponse.json(
        {
          status: 'error',
          message:
            'Email sent but failed to update reset token. Please contact support.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        message:
          'Password reset email sent successfully. Please check your inbox.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message:
          'Failed to process password reset request. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
