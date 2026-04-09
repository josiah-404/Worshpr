import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LedgerTable } from '@/components/finance/LedgerTable';
import { FinanceReport } from '@/components/finance/FinanceReport';
import { AddEntryDialog } from '@/components/finance/AddEntryDialog';
import { EventFinanceHeader } from '@/components/finance/EventFinanceHeader';
import type { LedgerEntry, FinanceCategory, FinanceEntryType, EventFinanceSummaryItem } from '@/types/finance.types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventFinancePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session.user.role;
  if (role === 'officer' && session.user.title !== 'Treasurer') redirect('/');

  const { eventId } = await params;
  const orgId = session.user.orgId;

  const [event, rawEntries] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true, title: true, startDate: true, endDate: true, venue: true,
        organizations: { select: { orgId: true } },
      },
    }),
    orgId ? prisma.financeLedger.findMany({
      where: { eventId, ...(role !== 'super_admin' && orgId ? { orgId } : {}) },
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
  ]);

  if (!event) notFound();

  // Guard: org must be part of this event
  if (role !== 'super_admin' && orgId && !event.organizations.some((o) => o.orgId === orgId)) {
    redirect('/finance');
  }

  const entries: LedgerEntry[] = rawEntries.map((e) => ({
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

  const totalIncome = entries.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);

  const summary: EventFinanceSummaryItem = {
    eventId: event.id,
    eventTitle: event.title,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    registrationIncome: entries.filter((e) => e.category === 'REGISTRATION').reduce((s, e) => s + e.amount, 0),
    offertoryIncome: entries.filter((e) => e.category === 'OFFERTORY').reduce((s, e) => s + e.amount, 0),
    donationIncome: entries.filter((e) => e.category === 'DONATION').reduce((s, e) => s + e.amount, 0),
    otherIncome: entries.filter((e) => e.category === 'OTHER_INCOME').reduce((s, e) => s + e.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Finance
      </Link>

      {/* Header */}
      <EventFinanceHeader event={event} summary={summary} defaultEventId={eventId} />

      {/* Ledger */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Transactions</h2>
        <LedgerTable initialData={entries} events={[{ id: event.id, title: event.title }]} filterEventId={eventId} />
      </div>

      {/* Report */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Report</h2>
        <FinanceReport
          entries={entries}
          events={[{ id: event.id, title: event.title }]}
          summaries={[summary]}
        />
      </div>
    </div>
  );
}
