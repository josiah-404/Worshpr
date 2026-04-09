import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { orgFundSchema } from '@/validations/finance.schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = session.user.role === 'super_admin'
      ? (req.nextUrl.searchParams.get('orgId') ?? session.user.orgId)
      : session.user.orgId;
    if (!orgId) return NextResponse.json({ data: null }, { status: 200 });

    let fund = await prisma.orgFund.findUnique({ where: { orgId } });
    if (!fund) {
      fund = await prisma.orgFund.create({
        data: { orgId, initialBalance: 0, currency: 'PHP' },
      });
    }

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.financeLedger.aggregate({
        where: { orgId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.financeLedger.aggregate({
        where: { orgId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;

    return NextResponse.json({
      data: {
        id: fund.id,
        orgId: fund.orgId,
        initialBalance: fund.initialBalance,
        currency: fund.currency,
        notes: fund.notes,
        totalIncome,
        totalExpenses,
        currentCOH: fund.initialBalance + totalIncome - totalExpenses,
        createdAt: fund.createdAt.toISOString(),
        updatedAt: fund.updatedAt.toISOString(),
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role === 'officer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const orgId = session.user.orgId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const parsed = orgFundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const fund = await prisma.orgFund.upsert({
      where: { orgId },
      create: { orgId, ...parsed.data },
      update: parsed.data,
    });

    return NextResponse.json({
      data: {
        ...fund,
        createdAt: fund.createdAt.toISOString(),
        updatedAt: fund.updatedAt.toISOString(),
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
