import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TokenType } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendOnboardingEmail } from '@/lib/mail';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.password !== null) {
      return NextResponse.json(
        { error: 'User has already set up their account.' },
        { status: 409 },
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const setupUrl = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`;

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: id, type: TokenType.PASSWORD_SETUP },
      }),
      prisma.passwordResetToken.create({
        data: { userId: id, token, type: TokenType.PASSWORD_SETUP, expires },
      }),
    ]);

    await sendOnboardingEmail(user.email, user.name, setupUrl);

    return NextResponse.json({ message: 'Onboarding email sent.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
