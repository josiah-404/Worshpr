'use client';

import { type FC, useMemo } from 'react';
import { LedgerTable } from '@/components/finance/LedgerTable';
import { FinanceReport } from '@/components/finance/FinanceReport';
import { EventFinanceHeader } from '@/components/finance/EventFinanceHeader';
import { useGetLedger } from '@/hooks/useGetLedger';
import type { LedgerEntry } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventFinanceClientProps {
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string | null;
  };
  initialEntries: LedgerEntry[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EventFinanceClient: FC<EventFinanceClientProps> = ({ event, initialEntries }) => {
  const { data: entries = initialEntries } = useGetLedger({ eventId: event.id }, initialEntries);

  const summary = useMemo(() => {
    const totalIncome = entries.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
    const totalExpenses = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
    return {
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
  }, [entries, event.id, event.title]);

  return (
    <>
      <EventFinanceHeader event={event} summary={summary} defaultEventId={event.id} />

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Transactions</h2>
        <LedgerTable
          initialData={entries}
          events={[{ id: event.id, title: event.title }]}
          filterEventId={event.id}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Report</h2>
        <FinanceReport
          entries={entries}
          events={[{ id: event.id, title: event.title }]}
          summaries={[summary]}
          fixedEventId={event.id}
        />
      </div>
    </>
  );
};
