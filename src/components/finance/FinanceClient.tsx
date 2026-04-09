'use client';

import { type FC, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrgFundCard } from '@/components/finance/OrgFundCard';
import { LedgerTable } from '@/components/finance/LedgerTable';
import { EventFinanceSummary } from '@/components/finance/EventFinanceSummary';
import { FinanceReport } from '@/components/finance/FinanceReport';
import { AddEntryDialog } from '@/components/finance/AddEntryDialog';
import { useGetFinanceSummary } from '@/hooks/useGetFinanceSummary';
import { useGetLedger } from '@/hooks/useGetLedger';
import { useGetOrgFund } from '@/hooks/useGetOrgFund';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { OrgFundDetail, FinanceSummary, LedgerEntry } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'ledger' | 'reports';

interface FinanceClientProps {
  initialFund: OrgFundDetail | null;
  initialSummary: FinanceSummary | null;
  initialEntries: LedgerEntry[];
  events: { id: string; title: string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FinanceClient: FC<FinanceClientProps> = ({
  initialFund, initialSummary, initialEntries, events,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_FUND] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEDGER] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCE_SUMMARY] });
    setRefreshing(false);
  };

  const { data: fund } = useGetOrgFund(initialFund);
  const { data: summary } = useGetFinanceSummary(initialSummary);
  const { data: entries = initialEntries } = useGetLedger(undefined, initialEntries);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar + Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <OrgFundCard initialData={fund} />
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Event Breakdown
            </h2>
            <EventFinanceSummary summaries={summary?.eventBreakdowns ?? []} />
          </div>

          {/* Standalone expenses callout */}
          {(summary?.standaloneExpenses ?? 0) > 0 && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Standalone expenses (no event)</span>
              <span className="font-semibold text-destructive">
                −₱{(summary?.standaloneExpenses ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ledger */}
      {activeTab === 'ledger' && (
        <LedgerTable initialData={entries} events={events} />
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <FinanceReport
          entries={entries}
          events={events}
          summaries={summary?.eventBreakdowns ?? []}
        />
      )}

      {/* Add Entry Dialog */}
      <AddEntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        events={events}
      />
    </div>
  );
};
