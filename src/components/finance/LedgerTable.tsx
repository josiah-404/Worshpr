'use client';

import { type FC, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Trash2, ExternalLink, X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetLedger } from '@/hooks/useGetLedger';
import { useDeleteLedgerEntry } from '@/hooks/useDeleteLedgerEntry';
import { FINANCE_CATEGORY_LABELS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/finance.types';
import { cn } from '@/lib/utils';
import type { LedgerEntry, FinanceEntryType, FinanceCategory } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerTableProps {
  initialData?: LedgerEntry[];
  events: { id: string; title: string }[];
  filterEventId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: 'ALL' },
  { label: '── Income ──', value: '__income_header__', disabled: true },
  ...INCOME_CATEGORIES.map((c) => ({ label: FINANCE_CATEGORY_LABELS[c], value: c })),
  { label: '── Expense ──', value: '__expense_header__', disabled: true },
  ...EXPENSE_CATEGORIES.map((c) => ({ label: FINANCE_CATEGORY_LABELS[c], value: c })),
];

// ─── Component ────────────────────────────────────────────────────────────────

export const LedgerTable: FC<LedgerTableProps> = ({ initialData, events, filterEventId }) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>(filterEventId ?? 'ALL');
  const [pendingDelete, setPendingDelete] = useState<LedgerEntry | null>(null);

  const params = useMemo(() => ({
    ...(typeFilter !== 'ALL' ? { type: typeFilter as FinanceEntryType } : {}),
    ...(categoryFilter !== 'ALL' ? { category: categoryFilter as FinanceCategory } : {}),
    ...(eventFilter !== 'ALL' ? { eventId: eventFilter } : {}),
  }), [typeFilter, categoryFilter, eventFilter]);

  const hasActiveFilters = typeFilter !== 'ALL' || categoryFilter !== 'ALL' || eventFilter !== 'ALL';

  // Never pass initialData into the hook — staleTime suppresses re-fetches when the query key changes.
  const { data: fetchedEntries, isLoading } = useGetLedger(params);
  const entries = fetchedEntries ?? (hasActiveFilters ? [] : (initialData ?? []));
  const { mutate: deleteEntry } = useDeleteLedgerEntry();

  const hasFilters = hasActiveFilters;

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete.id, {
      onSuccess: () => { toast.success('Entry deleted'); setPendingDelete(null); },
      onError: (e) => { toast.error(e instanceof Error ? e.message : 'Failed to delete'); setPendingDelete(null); },
    });
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!filterEventId && (
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Events" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Events</SelectItem>
              <SelectItem value="STANDALONE">No Event (Standalone)</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
            onClick={() => { setTypeFilter('ALL'); setCategoryFilter('ALL'); if (!filterEventId) setEventFilter('ALL'); }}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-center">
          <p className="text-sm text-muted-foreground">No entries found</p>
          {hasFilters && <Button variant="link" size="sm" onClick={() => { setTypeFilter('ALL'); setCategoryFilter('ALL'); }}>Clear filters</Button>}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Event</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium leading-tight">{entry.description}</p>
                    {entry.payee && <p className="text-xs text-muted-foreground">To: {entry.payee}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className={cn('gap-1 text-xs w-fit', entry.type === 'INCOME' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-destructive border-destructive/30 bg-destructive/10')}>
                        {entry.type === 'INCOME'
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />
                        }
                        {FINANCE_CATEGORY_LABELS[entry.category]}
                      </Badge>
                      {entry.customCategory && (
                        <span className="text-xs text-muted-foreground pl-0.5">{entry.customCategory}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {entry.eventTitle ?? <span className="italic">Standalone</span>}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', entry.type === 'INCOME' ? 'text-emerald-500' : 'text-destructive')}>
                    {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {entry.receiptUrl && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={entry.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {!entry.referenceId && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setPendingDelete(entry)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Entry"
        description={pendingDelete ? `"${pendingDelete.description}" will be permanently removed from the ledger.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
