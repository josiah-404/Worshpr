import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrgAccessError, resolveFilterOrgId, assertCanManageFinance } from '@/lib/org-access';
import { ledgerEntrySchema } from '@/validations/finance.schema';
import type { FinanceEntryType, FinanceCategory } from '@/types/finance.types';

const LEDGER_SELECT = {
  id: true,
  orgId: true,
  eventId: true,
  type: true,
  category: true,
  customCategory: true,
  amount: true,
  description: true,
  referenceId: true,
  payee: true,
  requestedBy: true,
  receiptUrl: true,
  enteredBy: true,
  date: true,
  createdAt: true,
  updatedAt: true,
  event: { select: { title: true } },
  enteredByUser: { select: { name: true } },
} as const;

function mapEntry(e: {
  id: string; orgId: string; eventId: string | null; type: string; category: string;
  customCategory: string | null; amount: number; description: string;
  referenceId: string | null; payee: string | null;
  requestedBy: string | null; receiptUrl: string | null; enteredBy: string;
  date: Date; createdAt: Date; updatedAt: Date;
  event: { title: string } | null;
  enteredByUser: { name: string };
}) {
  return {
    id: e.id,
    orgId: e.orgId,
    eventId: e.eventId,
    eventTitle: e.event?.title ?? null,
    type: e.type as FinanceEntryType,
    category: e.category as FinanceCategory,
    customCategory: e.customCategory ?? null,
    amount: e.amount,
    description: e.description,
    referenceId: e.referenceId,
    payee: e.payee,
    requestedBy: e.requestedBy,
    receiptUrl: e.receiptUrl,
    enteredBy: e.enteredBy,
    enteredByName: e.enteredByUser.name,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = resolveFilterOrgId(session, req.nextUrl.searchParams.get('orgId'));

    const eventId = req.nextUrl.searchParams.get('eventId') ?? undefined;
    const type = req.nextUrl.searchParams.get('type') as FinanceEntryType | null;
    const category = req.nextUrl.searchParams.get('category') as FinanceCategory | null;
    const dateFrom = req.nextUrl.searchParams.get('dateFrom');
    const dateTo = req.nextUrl.searchParams.get('dateTo');

    const entries = await prisma.financeLedger.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        ...(eventId ? { eventId } : {}),
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(dateFrom || dateTo ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        } : {}),
      },
      orderBy: { date: 'desc' },
      select: LEDGER_SELECT,
    });

    return NextResponse.json({ data: entries.map(mapEntry) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    assertCanManageFinance(session);

    const body = await req.json();

    const orgId = resolveFilterOrgId(session, body.orgId);

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const parsed = ledgerEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { date, eventId, ...rest } = parsed.data;

    const entry = await prisma.financeLedger.create({
      data: {
        ...rest,
        date: new Date(date),
        orgId,
        enteredBy: session.user.id,
        ...(eventId ? { eventId } : {}),
      },
      select: LEDGER_SELECT,
    });

    return NextResponse.json({ data: mapEntry(entry) }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[POST /finance/ledger]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
