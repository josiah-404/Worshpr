'use client';

import { useState, useMemo, type FC } from 'react';
import {
  PlusCircle, Pencil, Trash2, CreditCard,
  Smartphone, Building2, QrCode, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useGetPaymentAccounts } from '@/hooks/useGetPaymentAccounts';
import { useDeletePaymentAccount } from '@/hooks/useDeletePaymentAccount';
import { useUpdatePaymentAccount } from '@/hooks/useUpdatePaymentAccount';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgContext } from '@/providers/OrgContext';
import { PaymentAccountDialog } from './PaymentAccountDialog';
import { toast } from 'sonner';
import type { PaymentAccount } from '@/types';

const METHOD_LABELS: Record<string, string> = {
  GCASH: 'GCash',
  MAYA: 'Maya',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  GCASH: Smartphone,
  MAYA: Smartphone,
  BANK_TRANSFER: Building2,
  OTHER: CreditCard,
};

const METHOD_COLORS: Record<string, string> = {
  GCASH: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MAYA: 'bg-green-500/10 text-green-400 border-green-500/20',
  BANK_TRANSFER: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  OTHER: 'bg-muted/50 text-muted-foreground border-border',
};

interface PaymentAccountsClientProps {
  orgId: string;
  initialAccounts: PaymentAccount[];
}

export const PaymentAccountsClient: FC<PaymentAccountsClientProps> = ({
  orgId: ssrOrgId,
  initialAccounts,
}) => {
  // Use activeOrgId from OrgContext so super_admin org-switcher works
  const { activeOrgId } = useOrgContext();
  const orgId = activeOrgId ?? ssrOrgId;

  const { data: accounts = initialAccounts } = useGetPaymentAccounts(orgId || null);
  const { mutate: deleteAccount } = useDeletePaymentAccount();
  const { mutate: updateAccount } = useUpdatePaymentAccount();

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Payment Account',
    description: 'This will permanently delete the payment account. Events using it will lose their linked account.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);

  const hasFilters = methodFilter !== 'ALL' || statusFilter !== 'ALL';

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (methodFilter !== 'ALL' && a.method !== methodFilter) return false;
      if (statusFilter === 'ACTIVE' && !a.isActive) return false;
      if (statusFilter === 'INACTIVE' && a.isActive) return false;
      return true;
    });
  }, [accounts, methodFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(account: PaymentAccount) {
    setEditing(account);
    setDialogOpen(true);
  }

  async function handleDelete(account: PaymentAccount) {
    const ok = await confirm();
    if (!ok) return;
    deleteAccount(account.id, {
      onSuccess: () => toast.success('Payment account deleted'),
      onError: () => toast.error('Failed to delete payment account'),
    });
  }

  function handleToggleActive(account: PaymentAccount) {
    updateAccount(
      { id: account.id, data: { isActive: !account.isActive } },
      {
        onSuccess: () =>
          toast.success(account.isActive ? 'Account deactivated' : 'Account activated'),
        onError: () => toast.error('Failed to update account'),
      },
    );
  }

  if (!orgId) {
    return (
      <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No organization selected</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an organization from the top bar to manage payment accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              <SelectItem value="GCASH">GCash</SelectItem>
              <SelectItem value="MAYA">Maya</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
              onClick={() => { setMethodFilter('ALL'); setStatusFilter('ALL'); }}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No payment accounts yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a payment account so registrants know where to send payments.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm text-muted-foreground">No accounts match your filters</p>
          <Button variant="link" size="sm" onClick={() => { setMethodFilter('ALL'); setStatusFilter('ALL'); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Number / Mobile</TableHead>
                <TableHead>QR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((account) => {
                const Icon = METHOD_ICONS[account.method] ?? CreditCard;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{account.label}</p>
                          <p className="text-xs text-muted-foreground">{account.accountName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', METHOD_COLORS[account.method])}>
                        {METHOD_LABELS[account.method] ?? account.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {account.accountNumber}
                      {account.bankName && (
                        <span className="ml-1 font-sans text-muted-foreground/60">· {account.bankName}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.qrCodeUrl ? (
                        <a href={account.qrCodeUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <QrCode className="h-3.5 w-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleToggleActive(account)}>
                        <Badge variant="outline" className={cn(
                          'cursor-pointer',
                          account.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                        )}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PaymentAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        orgId={orgId ?? ''}
      />

      {ConfirmDialogEl}
    </>
  );
};
