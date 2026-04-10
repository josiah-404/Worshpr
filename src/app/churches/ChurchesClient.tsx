'use client';

import { type FC, useState, useMemo } from 'react';
import { PlusCircle, Pencil, Trash2, Church as ChurchIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useGetChurches } from '@/hooks/useGetChurches';
import { useDeleteChurch } from '@/hooks/useDeleteChurch';
import { useUpdateChurch } from '@/hooks/useUpdateChurch';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgContext } from '@/providers/OrgContext';
import { ChurchDialog } from './ChurchDialog';
import type { Church, Organization } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface ChurchesClientProps {
  ssrOrgId: string;
  initialChurches: Church[];
  isSuperAdmin: boolean;
  organizations: Organization[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const ChurchesClient: FC<ChurchesClientProps> = ({
  ssrOrgId,
  initialChurches,
  isSuperAdmin,
  organizations,
}) => {
  const { activeOrgId } = useOrgContext();
  const orgId = activeOrgId ?? ssrOrgId;

  const { data: churches = initialChurches } = useGetChurches(isSuperAdmin ? (orgId || null) : orgId);
  const { mutate: deleteChurch } = useDeleteChurch();
  const { mutate: updateChurch } = useUpdateChurch();

  const [orgFilter, setOrgFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Church | null>(null);

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Church',
    description: 'This will permanently delete the church.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  const hasFilters = orgFilter !== 'ALL' || statusFilter !== 'ALL';

  const filtered = useMemo(() => churches.filter((c) => {
    if (orgFilter !== 'ALL' && c.orgId !== orgFilter) return false;
    if (statusFilter === 'ACTIVE' && !c.isActive) return false;
    if (statusFilter === 'INACTIVE' && c.isActive) return false;
    return true;
  }), [churches, orgFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(church: Church) {
    setEditing(church);
    setDialogOpen(true);
  }

  async function handleDelete(church: Church) {
    const ok = await confirm();
    if (!ok) return;
    deleteChurch(church.id, {
      onSuccess: () => toast.success('Church deleted'),
      onError: () => toast.error('Failed to delete church'),
    });
  }

  function handleToggleActive(church: Church) {
    updateChurch(
      { id: church.id, data: { isActive: !church.isActive } },
      {
        onSuccess: () => toast.success(church.isActive ? 'Church deactivated' : 'Church activated'),
        onError: () => toast.error('Failed to update church'),
      },
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Organizations</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
              onClick={() => { setOrgFilter('ALL'); setStatusFilter('ALL'); }}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Church
        </Button>
      </div>

      {churches.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ChurchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No churches yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add churches to your organization so registrants can select them.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Church
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm text-muted-foreground">No churches match your filters</p>
          <Button variant="link" size="sm" onClick={() => { setOrgFilter('ALL'); setStatusFilter('ALL'); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church</TableHead>
                {isSuperAdmin && <TableHead>Organization</TableHead>}
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((church) => (
                <TableRow key={church.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                        <ChurchIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{church.name}</span>
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-muted-foreground text-sm">{church.orgName}</TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {church.location ?? <span className="italic text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(church)}>
                      <Badge variant="outline" className={cn(
                        'cursor-pointer',
                        church.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                      )}>
                        {church.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(church)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(church)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChurchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultOrgId={orgId ?? ''}
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
      />

      {ConfirmDialogEl}
    </>
  );
};
