import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventFinanceClient } from '@/components/finance/EventFinanceClient';
import type { LedgerEntry, FinanceCategory, FinanceEntryType } from '@/types/finance.types';

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
    prisma.financeLedger.findMany({
      where: {
        eventId,
        // super_admin sees all org entries for the event; others see only their org's
        ...(role !== 'super_admin' && orgId ? { orgId } : {}),
      },
      orderBy: { date: 'desc' },
      select: {
        id: true, orgId: true, eventId: true, type: true, category: true,
        customCategory: true, amount: true, description: true, referenceId: true,
        payee: true, requestedBy: true, receiptUrl: true, enteredBy: true,
        date: true, createdAt: true, updatedAt: true,
        event: { select: { title: true } },
        enteredByUser: { select: { name: true } },
      },
    }),
  ]);

  if (!event) notFound();

  // Guard: org must be part of this event
  if (role !== 'super_admin' && orgId && !event.organizations.some((o) => o.orgId === orgId)) {
    redirect('/finance');
  }

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
      <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Finance
      </Link>

      <EventFinanceClient event={event} initialEntries={initialEntries} />
    </div>
  );
}
