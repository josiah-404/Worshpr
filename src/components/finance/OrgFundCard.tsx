'use client';

import { type FC, useState } from 'react';
import { Pencil, Wallet, TrendingUp, TrendingDown, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetOrgFund } from '@/hooks/useGetOrgFund';
import { useUpdateOrgFund } from '@/hooks/useUpdateOrgFund';
import { cn } from '@/lib/utils';
import type { OrgFundDetail } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgFundCardProps {
  initialData?: OrgFundDetail | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OrgFundCard: FC<OrgFundCardProps> = ({ initialData }) => {
  const { data: fund, isLoading } = useGetOrgFund(initialData);
  const { mutate: updateFund, isPending } = useUpdateOrgFund();

  const [editing, setEditing] = useState(false);
  const [draftBalance, setDraftBalance] = useState('');

  const handleEditStart = () => {
    setDraftBalance(String(fund?.initialBalance ?? 0));
    setEditing(true);
  };

  const handleSave = () => {
    const val = parseFloat(draftBalance);
    if (isNaN(val) || val < 0) {
      toast.error('Invalid amount', { description: 'Enter a valid non-negative number.' });
      return;
    }
    updateFund(
      { initialBalance: val, notes: fund?.notes ?? undefined },
      {
        onSuccess: () => { toast.success('Initial balance updated'); setEditing(false); },
        onError: () => toast.error('Failed to update balance'),
      },
    );
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const coh = fund?.currentCOH ?? 0;
  const isPositive = coh >= 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base">Cash on Hand</h2>
        </div>
        {!editing && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditStart}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* COH */}
      <div>
        <p className={cn('text-4xl font-bold tabular-nums', isPositive ? 'text-emerald-500' : 'text-destructive')}>
          {formatCurrency(coh)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Current balance</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
        {/* Initial Balance */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Initial Balance</p>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draftBalance}
                onChange={(e) => setDraftBalance(e.target.value)}
                className="h-7 text-sm px-2"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-emerald-500" onClick={handleSave} disabled={isPending}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <p className="font-semibold text-sm">{formatCurrency(fund?.initialBalance ?? 0)}</p>
          )}
        </div>

        {/* Total Income */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            Total Income
          </div>
          <p className="font-semibold text-sm text-emerald-500">{formatCurrency(fund?.totalIncome ?? 0)}</p>
        </div>

        {/* Total Expenses */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-destructive" />
            Total Expenses
          </div>
          <p className="font-semibold text-sm text-destructive">{formatCurrency(fund?.totalExpenses ?? 0)}</p>
        </div>
      </div>
    </div>
  );
};
