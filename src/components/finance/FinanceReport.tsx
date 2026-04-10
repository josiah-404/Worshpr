'use client';

import { type FC, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Printer, TrendingUp, TrendingDown, ChevronRight, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FINANCE_CATEGORY_LABELS } from '@/types/finance.types';
import { cn } from '@/lib/utils';
import type { LedgerEntry, EventFinanceSummaryItem } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinanceReportProps {
  entries: LedgerEntry[];
  events: { id: string; title: string }[];
  summaries: EventFinanceSummaryItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱${Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ─── Registration Breakdown Dialog ────────────────────────────────────────────

const RegistrationBreakdownDialog: FC<{
  open: boolean;
  onClose: () => void;
  entries: LedgerEntry[];
}> = ({ open, onClose, entries }) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-500" />
          Registration Breakdown
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
        <div className="grid grid-cols-[1fr_auto] text-xs text-muted-foreground px-2 pb-1 border-b">
          <span>Registrant</span>
          <span className="text-right">Amount</span>
        </div>
        {entries.map((e) => (
          <div key={e.id} className="grid grid-cols-[1fr_auto] items-center px-2 py-2 rounded hover:bg-muted/40">
            <div>
              <p className="text-sm font-medium">{e.description.replace('Registration — ', '')}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d, yyyy')}</p>
            </div>
            <span className="text-sm font-semibold text-emerald-500 tabular-nums">+{fmt(e.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-semibold">Total</span>
        <span className="font-bold text-emerald-500 tabular-nums">
          +{fmt(entries.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>
    </DialogContent>
  </Dialog>
);

// ─── Income Table ─────────────────────────────────────────────────────────────

const IncomeTable: FC<{ entries: LedgerEntry[]; total: number }> = ({ entries, total }) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const registrationEntries = entries.filter((e) => e.category === 'REGISTRATION');
  const registrationTotal = registrationEntries.reduce((s, e) => s + e.amount, 0);
  const otherIncome = entries.filter((e) => e.category !== 'REGISTRATION');

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-32 hidden sm:table-cell">Category</TableHead>
            <TableHead className="text-right w-28">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Registration — grouped row */}
          {registrationEntries.length > 0 && (
            <TableRow
              className="cursor-pointer group print:hover:bg-transparent"
              onClick={() => setBreakdownOpen(true)}
            >
              <TableCell className="text-muted-foreground text-xs align-top">
                {format(new Date(registrationEntries[0].date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">
                    Registrations
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                      ({registrationEntries.length} {registrationEntries.length === 1 ? 'registrant' : 'registrants'})
                    </span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors print:hidden" />
                </div>
                <p className="text-xs text-muted-foreground print:hidden">Click to view breakdown</p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">Registration</TableCell>
              <TableCell className="text-right font-semibold text-emerald-500 tabular-nums">
                +{fmt(registrationTotal)}
              </TableCell>
            </TableRow>
          )}

          {/* Other income entries */}
          {otherIncome.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-muted-foreground text-xs align-top">
                {format(new Date(e.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="font-medium">{e.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                {e.customCategory
                  ? <>{FINANCE_CATEGORY_LABELS[e.category]} <span className="text-foreground/70">· {e.customCategory}</span></>
                  : FINANCE_CATEGORY_LABELS[e.category]
                }
              </TableCell>
              <TableCell className="text-right font-semibold text-emerald-500 tabular-nums">
                +{fmt(e.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold text-sm">Total Income</TableCell>
            <TableCell className="text-right font-bold text-emerald-500 tabular-nums">{fmt(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <RegistrationBreakdownDialog
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        entries={registrationEntries}
      />
    </>
  );
};

// ─── Expense Table ────────────────────────────────────────────────────────────

const ExpenseTable: FC<{ entries: LedgerEntry[]; total: number }> = ({ entries, total }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-28">Date</TableHead>
        <TableHead>Description</TableHead>
        <TableHead className="w-32 hidden sm:table-cell">Category</TableHead>
        <TableHead className="text-right w-28">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {entries.map((e) => (
        <TableRow key={e.id}>
          <TableCell className="text-muted-foreground text-xs align-top">
            {format(new Date(e.date), 'MMM d, yyyy')}
          </TableCell>
          <TableCell>
            <p className="font-medium">{e.description}</p>
            {e.payee && <p className="text-xs text-muted-foreground">To: {e.payee}</p>}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
            {e.customCategory
              ? <>{FINANCE_CATEGORY_LABELS[e.category]} <span className="text-foreground/70">· {e.customCategory}</span></>
              : FINANCE_CATEGORY_LABELS[e.category]
            }
          </TableCell>
          <TableCell className="text-right font-semibold text-destructive tabular-nums">
            -{fmt(e.amount)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className="font-bold text-sm">Total Expenses</TableCell>
        <TableCell className="text-right font-bold text-destructive tabular-nums">{fmt(total)}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const FinanceReport: FC<FinanceReportProps> = ({ entries, events, summaries }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');

  const filteredEntries = useMemo(() => {
    if (selectedEventId === 'ALL') return entries;
    if (selectedEventId === 'STANDALONE') return entries.filter((e) => !e.eventId);
    return entries.filter((e) => e.eventId === selectedEventId);
  }, [entries, selectedEventId]);

  const incomeEntries = filteredEntries.filter((e) => e.type === 'INCOME');
  const expenseEntries = filteredEntries.filter((e) => e.type === 'EXPENSE');
  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpenses;

  const reportTitle = selectedEventId === 'ALL'
    ? 'All Events — Finance Report'
    : selectedEventId === 'STANDALONE'
      ? 'Standalone Expenses Report'
      : (events.find((e) => e.id === selectedEventId)?.title ?? 'Event') + ' — Finance Report';

  return (
    <div className="space-y-4">
      {/* Controls — hidden on print */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Events</SelectItem>
            <SelectItem value="STANDALONE">Standalone (No Event)</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print Report
        </Button>
      </div>

      {/* Report body — finance-report-printable isolates this for @media print */}
      <div className="finance-report-printable rounded-xl border bg-card print:rounded-none print:border-0 print:bg-white print:text-black overflow-hidden">

        {/* Print header — only visible on print */}
        <div className="hidden print:flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">Finance Report</p>
            <h1 className="text-base font-bold text-gray-900">{reportTitle}</h1>
            <p className="text-[9px] text-gray-400 mt-0.5">Generated {format(new Date(), 'PPP')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black tracking-tight text-orange-500">EMBR</p>
            <p className="text-[9px] text-gray-400">Financial Management System</p>
          </div>
        </div>

        <div className="p-6 print:px-6 print:py-4 space-y-8 print:space-y-5">
          {/* Screen header */}
          <div className="print:hidden">
            <h2 className="text-lg font-bold">{reportTitle}</h2>
            <p className="text-xs text-muted-foreground">Generated {format(new Date(), 'PPP')}</p>
          </div>

          {/* Income */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 print:hidden">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h3 className="font-semibold">Income</h3>
            </div>
            <p className="hidden print:block text-xs font-bold uppercase tracking-widest text-gray-400 pb-1">Income</p>
            {incomeEntries.length === 0
              ? <p className="text-sm text-muted-foreground italic">No income entries.</p>
              : <IncomeTable entries={incomeEntries} total={totalIncome} />
            }
          </div>

          {/* Divider */}
          <div className="border-t print:border-gray-200" />

          {/* Expenses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 print:hidden">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold">Expenses</h3>
            </div>
            <p className="hidden print:block text-xs font-bold uppercase tracking-widest text-gray-400 pb-1">Expenses</p>
            {expenseEntries.length === 0
              ? <p className="text-sm text-muted-foreground italic">No expense entries.</p>
              : <ExpenseTable entries={expenseEntries} total={totalExpenses} />
            }
          </div>

          {/* Divider */}
          <div className="border-t print:border-gray-200" />

          {/* Net summary */}
          <div className={cn(
            'flex items-center justify-between rounded-xl px-5 py-4',
            'print:rounded-none print:border print:border-gray-200 print:px-4 print:py-3',
            net >= 0 ? 'bg-emerald-500/10 print:bg-white' : 'bg-destructive/10 print:bg-white',
          )}>
            <div>
              <p className="text-xs text-muted-foreground print:text-gray-400 uppercase tracking-wide font-medium">Net Result</p>
              <p className="font-bold text-base print:text-sm">{net >= 0 ? 'Surplus' : 'Deficit'}</p>
            </div>
            <span className={cn('text-2xl font-black tabular-nums print:text-xl', net >= 0 ? 'text-emerald-500' : 'text-destructive')}>
              {net >= 0 ? '+' : '-'}{fmt(net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
