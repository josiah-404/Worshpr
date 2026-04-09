import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FinanceClient } from '@/components/finance/FinanceClient';
import type { OrgFundDetail, FinanceSummary, LedgerEntry, FinanceCategory, FinanceEntryType } from '@/types/finance.types';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session.user.role;
  const orgId = session.user.orgId;

  if (role === 'officer' && session.user.title !== 'Treasurer') redirect('/');
  if (!orgId && role !== 'super_admin') redirect('/');

  // Fetch all data in parallel
  const [fund, rawEntries, events, categoryTotals] = await Promise.all([
    orgId ? prisma.orgFund.findUnique({ where: { orgId } }) : null,
    orgId ? prisma.financeLedger.findMany({
      where: { orgId },
      orderBy: { date: 'desc' },
      select: {
        id: true, orgId: true, eventId: true, type: true, category: true,
        customCategory: true, amount: true, description: true, referenceId: true,
        payee: true, requestedBy: true, receiptUrl: true, enteredBy: true,
        date: true, createdAt: true, updatedAt: true,
        event: { select: { title: true } },
        enteredByUser: { select: { name: true } },
      },
    }) : [],
    orgId ? prisma.event.findMany({
      where: { organizations: { some: { orgId } } },
      orderBy: { startDate: 'desc' },
      select: { id: true, title: true },
    }) : [],
    orgId ? prisma.financeLedger.groupBy({
      by: ['eventId', 'type', 'category'],
      where: { orgId },
      _sum: { amount: true },
    }) : [],
  ]);

  // Build OrgFund with computed COH
  const totalIncome = categoryTotals.filter((r) => r.type === 'INCOME').reduce((s, r) => s + (r._sum.amount ?? 0), 0);
  const totalExpenses = categoryTotals.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + (r._sum.amount ?? 0), 0);
  const initialBalance = fund?.initialBalance ?? 0;

  const initialFund: OrgFundDetail | null = orgId ? {
    id: fund?.id ?? '',
    orgId: orgId,
    initialBalance,
    currency: fund?.currency ?? 'PHP',
    notes: fund?.notes ?? null,
    totalIncome,
    totalExpenses,
    currentCOH: initialBalance + totalIncome - totalExpenses,
    createdAt: fund?.createdAt.toISOString() ?? new Date().toISOString(),
    updatedAt: fund?.updatedAt.toISOString() ?? new Date().toISOString(),
  } : null;

  // Build per-event breakdown
  const eventMap = new Map(events.map((e) => [e.id, e.title]));
  const breakdownMap = new Map<string | null, { totalIncome: number; totalExpenses: number; registrationIncome: number; offertoryIncome: number; donationIncome: number; otherIncome: number }>();

  for (const row of categoryTotals) {
    const key = row.eventId;
    if (!breakdownMap.has(key)) {
      breakdownMap.set(key, { totalIncome: 0, totalExpenses: 0, registrationIncome: 0, offertoryIncome: 0, donationIncome: 0, otherIncome: 0 });
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

  const standaloneExpenses = breakdownMap.get(null)?.totalExpenses ?? 0;

  const initialSummary: FinanceSummary | null = orgId ? {
    orgId,
    initialBalance,
    totalIncome,
    totalExpenses,
    currentCOH: initialBalance + totalIncome - totalExpenses,
    standaloneExpenses,
    eventBreakdowns: Array.from(breakdownMap.entries())
      .filter(([key]) => key !== null)
      .map(([eventId, totals]) => ({
        eventId: eventId!,
        eventTitle: eventMap.get(eventId!) ?? 'Unknown Event',
        ...totals,
        net: totals.totalIncome - totals.totalExpenses,
      })),
  } : null;

  // Map ledger entries
  const initialEntries: LedgerEntry[] = rawEntries.map((e) => ({
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
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your organization&apos;s income and expenses
        </p>
      </div>
      <FinanceClient
        initialFund={initialFund}
        initialSummary={initialSummary}
        initialEntries={initialEntries}
        events={events}
      />
    </div>
  );
}
