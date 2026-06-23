import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  assertCanAccessOrg,
  assertCanManageFinance,
  orgIdWhereClause,
  OrgAccessError,
} from '@/lib/org-access';
import { createPaymentAccountSchema } from '@/validations/payment-account.schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryOrgId = req.nextUrl.searchParams.get('orgId');
    const orgFilter = orgIdWhereClause(session, queryOrgId);

    const accounts = await prisma.paymentAccount.findMany({
      where: orgFilter,
      orderBy: { createdAt: 'desc' },
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

    const data = accounts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch payment accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = createPaymentAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    assertCanManageFinance(session);
    assertCanAccessOrg(session, parsed.data.orgId);

    const account = await prisma.paymentAccount.create({
      data: {
        orgId: parsed.data.orgId,
        method: parsed.data.method,
        label: parsed.data.label,
        accountName: parsed.data.accountName,
        accountNumber: parsed.data.accountNumber,
        bankName: parsed.data.bankName ?? null,
        qrCodeUrl: parsed.data.qrCodeUrl ?? null,
        instructions: parsed.data.instructions ?? null,
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
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[POST /api/payment-accounts]', err);
    return NextResponse.json({
      error: 'Failed to create payment account',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
