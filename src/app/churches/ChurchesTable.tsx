'use client';

import { Suspense, useState, type FC } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { PlusCircle, Church as ChurchIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search } from '@/components/table/Search';
import { Pagination } from '@/components/table/Pagination';
import { ResponsiveTableLayout } from '@/components/table/ResponsiveTableLayout';
import { ChurchStatusFilter } from '@/components/churches/ChurchStatusFilter';
import { getChurchColumns } from '@/components/churches/ChurchColumns';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { useGetChurchesList } from '@/hooks/useGetChurchesList';
import { useDeleteChurch } from '@/hooks/useDeleteChurch';
import { useUpdateChurch } from '@/hooks/useUpdateChurch';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgContext } from '@/providers/OrgContext';
import { ChurchDialog } from '@/app/churches/ChurchDialog';
import type { Church, Organization } from '@/types';

const PAGE_SIZE = 10;

interface ChurchesTableProps {
  ssrOrgId: string;
  isSuperAdmin: boolean;
  organizations: Organization[];
}

function parseStatus(value: string | null): 'all' | 'active' | 'inactive' {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

function ChurchesTableInner({ ssrOrgId, isSuperAdmin, organizations }: ChurchesTableProps) {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const query = searchParams.get('query') ?? '';
  const status = parseStatus(searchParams.get('status'));

  const { activeOrgId } = useOrgContext();
  const orgId = activeOrgId ?? ssrOrgId;

  const { data, isLoading } = useGetChurchesList(
    { page, page_size: PAGE_SIZE, query, status },
    { isSuperAdmin, ssrOrgId },
  );
  const { mutate: deleteChurch } = useDeleteChurch();
  const { mutate: updateChurch } = useUpdateChurch();
  const { columnFilters } = useSearchFilter('church');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Church | null>(null);

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Church',
    description: 'This will permanently delete the church.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  const churches: Church[] = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = query.length > 0 || status !== 'all';

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
        onSuccess: () =>
          toast.success(church.isActive ? 'Church deactivated' : 'Church activated'),
        onError: () => toast.error('Failed to update church'),
      },
    );
  }

  const columns = getChurchColumns({
    isSuperAdmin,
    onEdit: openEdit,
    onDelete: handleDelete,
    onToggleActive: handleToggleActive,
  });

  const table = useReactTable({
    data: churches,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta?.totalPages ?? 1,
  });

  const showEmptyCta = !isLoading && (meta?.total ?? 0) === 0 && !hasFilters;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {meta?.total ?? 0} church{(meta?.total ?? 0) !== 1 ? 'es' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Church
        </Button>
      </div>

      {!showEmptyCta && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Search placeholder="Search churches by name or location..." />
          </div>
          <ChurchStatusFilter />
        </div>
      )}

      {showEmptyCta ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ChurchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No churches yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add churches to your organization so registrants can select them.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Church
          </Button>
        </div>
      ) : (
        <>
          <ResponsiveTableLayout
            table={table}
            columns={columns}
            isLoading={isLoading}
            loadingRows={PAGE_SIZE}
            noRecordMessage="No churches found. Try a different search or filter."
            renderMobileRow={(row: Row<Church>) => {
              const church = row.original;
              return (
                <div className="flex min-h-[3.5rem] items-center gap-2 px-4 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ChurchIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{church.name}</p>
                    {isSuperAdmin && (
                      <p className="truncate text-sm text-muted-foreground">{church.orgName}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-xs',
                      church.isActive
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-border bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {church.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => openEdit(church)}
                      aria-label="Edit church"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-destructive"
                      onClick={() => handleDelete(church)}
                      aria-label="Delete church"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />

          {meta && meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                pageSize={meta.pageSize}
                totalItems={meta.total}
              />
            </div>
          )}
        </>
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
}

export const ChurchesTable: FC<ChurchesTableProps> = (props) => (
  <Suspense>
    <ChurchesTableInner {...props} />
  </Suspense>
);
