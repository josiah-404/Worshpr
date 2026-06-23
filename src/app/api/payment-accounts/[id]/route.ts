import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  assertCanManageFinance,
  canAccessOrg,
  OrgAccessError,
} from '@/lib/org-access';
import { updatePaymentAccountSchema } from '@/validations/payment-account.schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await prisma.paymentAccount.findUnique({
      where: { id: params.id },
    });

    if (!account) return NextResponse.json({ error: 'Payment account not found' }, { status: 404 });
    if (!canAccessOrg(session, account.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    assertCanManageFinance(session);

    const body = await req.json();
    const parsed = updatePaymentAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.paymentAccount.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        bankName: parsed.data.bankName ?? undefined,
        qrCodeUrl: parsed.data.qrCodeUrl ?? undefined,
        instructions: parsed.data.instructions ?? undefined,
      },
      select: {
        id: true,
        orgId: true,
        method: true,
        label: true,
        accountName: true,
        accountNumber: true,
        bankName: true,
        qrCodeUrl: true,
        instructions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const data = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update payment account' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await prisma.paymentAccount.findUnique({
      where: { id: params.id },
    });

    if (!account) return NextResponse.json({ error: 'Payment account not found' }, { status: 404 });
    if (!canAccessOrg(session, account.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    assertCanManageFinance(session);

    await prisma.paymentAccount.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { message: 'Payment account deleted' } }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to delete payment account' }, { status: 500 });
  }
}
