'use client';

import { type FC } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventFinanceSummaryItem } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventFinanceSummaryProps {
  summaries: EventFinanceSummaryItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₱${Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

const EventCard: FC<{ item: EventFinanceSummaryItem }> = ({ item }) => {
  const isSurplus = item.net >= 0;

  return (
    <Link
      href={`/finance/events/${item.eventId}`}
      className="group rounded-xl border bg-card p-5 space-y-4 hover:border-primary/40 transition-colors"
    >
      {/* Title + Net badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-tight line-clamp-2 flex-1">{item.eventTitle}</p>
        <Badge
          variant="outline"
          className={cn('shrink-0 text-xs', isSurplus
            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
            : 'text-destructive bg-destructive/10 border-destructive/30'
          )}
        >
          {isSurplus ? 'Surplus' : 'Deficit'}
        </Badge>
      </div>

      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            Income
          </div>
          <p className="font-semibold text-sm text-emerald-500">{formatCurrency(item.totalIncome)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-destructive" />
            Expenses
          </div>
          <p className="font-semibold text-sm text-destructive">{formatCurrency(item.totalExpenses)}</p>
        </div>
      </div>

      {/* Net */}
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground">Net</span>
        <div className="flex items-center gap-2">
          <span className={cn('font-bold text-sm tabular-nums', isSurplus ? 'text-emerald-500' : 'text-destructive')}>
            {isSurplus ? '+' : '-'}{formatCurrency(item.net)}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const EventFinanceSummary: FC<EventFinanceSummaryProps> = ({ summaries }) => {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center gap-2">
        <p className="text-sm text-muted-foreground">No event finance data yet.</p>
        <p className="text-xs text-muted-foreground">Approve registrations or add entries to see breakdowns here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {summaries.map((s) => <EventCard key={s.eventId} item={s} />)}
    </div>
  );
};
