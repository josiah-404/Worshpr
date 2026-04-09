'use client';

import { type FC, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, MapPin, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddEntryDialog } from '@/components/finance/AddEntryDialog';
import { cn } from '@/lib/utils';
import type { EventFinanceSummaryItem } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventFinanceHeaderProps {
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string | null;
  };
  summary: EventFinanceSummaryItem;
  defaultEventId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱${Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EventFinanceHeader: FC<EventFinanceHeaderProps> = ({ event, summary, defaultEventId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const isSurplus = summary.net >= 0;

  return (
    <>
      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(event.startDate), 'MMM d')}–{format(new Date(event.endDate), 'MMM d, yyyy')}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue}
                </span>
              )}
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Total Income
            </div>
            <p className="font-bold text-emerald-500 tabular-nums">{fmt(summary.totalIncome)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-destructive" /> Total Expenses
            </div>
            <p className="font-bold text-destructive tabular-nums">{fmt(summary.totalExpenses)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Net</p>
            <div className="flex items-center gap-2">
              <p className={cn('font-bold tabular-nums', isSurplus ? 'text-emerald-500' : 'text-destructive')}>
                {isSurplus ? '+' : '-'}{fmt(summary.net)}
              </p>
              <Badge variant="outline" className={cn('text-xs', isSurplus
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                : 'text-destructive bg-destructive/10 border-destructive/30'
              )}>
                {isSurplus ? 'Surplus' : 'Deficit'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <AddEntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        events={[{ id: event.id, title: event.title }]}
        defaultEventId={defaultEventId}
        defaultType="EXPENSE"
      />
    </>
  );
};
