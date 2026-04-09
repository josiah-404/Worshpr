import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = session.user.role === 'super_admin'
      ? (req.nextUrl.searchParams.get('orgId') ?? session.user.orgId)
      : session.user.orgId;

    if (!orgId) return NextResponse.json({ data: null }, { status: 200 });

    // Fetch fund, ledger aggregates, and event list in parallel
    const [fund, categoryTotals, events] = await Promise.all([
      prisma.orgFund.findUnique({ where: { orgId } }),
      prisma.financeLedger.groupBy({
        by: ['eventId', 'type', 'category'],
        where: { orgId },
        _sum: { amount: true },
      }),
      prisma.event.findMany({
        where: { organizations: { some: { orgId } } },
        select: { id: true, title: true },
      }),
    ]);

    const initialBalance = fund?.initialBalance ?? 0;

    // Build per-event breakdown map
    const eventMap = new Map(events.map((e) => [e.id, e.title]));
    const breakdownMap = new Map<string | null, {
      totalIncome: number; totalExpenses: number;
      registrationIncome: number; offertoryIncome: number;
      donationIncome: number; otherIncome: number;
    }>();

    for (const row of categoryTotals) {
      const key = row.eventId;
      if (!breakdownMap.has(key)) {
        breakdownMap.set(key, {
          totalIncome: 0, totalExpenses: 0,
          registrationIncome: 0, offertoryIncome: 0,
          donationIncome: 0, otherIncome: 0,
        });
      }
      const entry = breakdownMap.get(key)!;
      const amount = row._sum.amount ?? 0;
      if (row.type === 'INCOME') {
        entry.totalIncome += amount;
        if (row.category === 'REGISTRATION') entry.registrationIncome += amount;
        else if (row.category === 'OFFERTORY') entry.offertoryIncome += amount;
        else if (row.category === 'DONATION') entry.donationIncome += amount;
        else entry.otherIncome += amount;
      } else {
        entry.totalExpenses += amount;
      }
    }

    // Build event breakdowns (only events that have ledger entries)
    const eventBreakdowns = Array.from(breakdownMap.entries())
      .filter(([key]) => key !== null)
      .map(([eventId, totals]) => ({
        eventId: eventId!,
        eventTitle: eventMap.get(eventId!) ?? 'Unknown Event',
        ...totals,
        net: totals.totalIncome - totals.totalExpenses,
      }));

    // Standalone (no event)
    const standalone = breakdownMap.get(null);
    const standaloneExpenses = standalone?.totalExpenses ?? 0;

    // Overall totals
    const totalIncome = Array.from(breakdownMap.values()).reduce((s, e) => s + e.totalIncome, 0);
    const totalExpenses = Array.from(breakdownMap.values()).reduce((s, e) => s + e.totalExpenses, 0);

    return NextResponse.json({
      data: {
        orgId,
        initialBalance,
        totalIncome,
        totalExpenses,
        currentCOH: initialBalance + totalIncome - totalExpenses,
        standaloneExpenses,
        eventBreakdowns,
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
