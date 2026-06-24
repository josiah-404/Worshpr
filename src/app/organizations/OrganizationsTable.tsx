'use client';

import { Suspense, useState, type FC } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { PlusCircle, Building2, Pencil, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search } from '@/components/table/Search';
import { Pagination } from '@/components/table/Pagination';
import { ResponsiveTableLayout } from '@/components/table/ResponsiveTableLayout';
import { getOrganizationColumns } from '@/components/organizations/OrganizationColumns';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { useGetOrganizationsList } from '@/hooks/useGetOrganizationsList';
import { useOrganizations, EMPTY_ORG_FORM } from '@/hooks/useOrganizations';
import { useConfirm } from '@/hooks/useConfirm';
import { OrganizationDialog } from '@/app/organizations/OrganizationDialog';
import type { OrganizationRow, OrganizationFormState } from '@/types';

const PAGE_SIZE = 10;

function OrganizationsTableInner() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const query = searchParams.get('query') ?? '';

  const { data, isLoading } = useGetOrganizationsList({ page, page_size: PAGE_SIZE, query });
  const { loading, error, setError, createOrganization, updateOrganization, deleteOrganization } =
    useOrganizations();
  const { columnFilters } = useSearchFilter('organization');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [open, setOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRow | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_ORG_FORM);

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Organization',
    description: 'This will permanently delete the organization and cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  const organizations: OrganizationRow[] = data?.data ?? [];
  const meta = data?.meta;

  function openCreate() {
    setEditingOrg(null);
    setForm(EMPTY_ORG_FORM);
    setError('');
    setOpen(true);
  }

  function openEdit(org: OrganizationRow) {
    setEditingOrg(org);
    setForm({ name: org.name, logoUrl: org.logoUrl ?? '' });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, form);
      } else {
        await createOrganization(form);
      }
      setOpen(false);
    } catch {
      // error is already set by the hook
    }
  }

  async function handleToggleActive(org: OrganizationRow) {
    await updateOrganization(org.id, { isActive: !org.isActive });
  }

  async function handleDelete(org: OrganizationRow) {
    const ok = await confirm();
    if (!ok) return;
    await deleteOrganization(org.id);
  }

  const columns = getOrganizationColumns({
    onEdit: openEdit,
    onDelete: handleDelete,
    onToggleActive: handleToggleActive,
  });

  const table = useReactTable({
    data: organizations,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta?.totalPages ?? 1,
  });

  const showEmptyCta = !isLoading && (meta?.total ?? 0) === 0 && !query;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total ?? 0} organization{(meta?.total ?? 0) !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      {!showEmptyCta && (
        <div className="mb-4">
          <Search placeholder="Search organizations..." />
        </div>
      )}

      {showEmptyCta ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No organizations yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create your first organization to get started.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
          </Button>
        </div>
      ) : (
        <>
          <ResponsiveTableLayout
            table={table}
            columns={columns}
            isLoading={isLoading}
            loadingRows={PAGE_SIZE}
            noRecordMessage="No organizations found. Try a different search."
            renderMobileRow={(row: Row<OrganizationRow>) => {
              const org = row.original;
              return (
                <div className="flex min-h-[3.5rem] items-center gap-2 px-4 py-2">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-8 w-8 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org._count.memberships} member{org._count.memberships !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-xs',
                      org.isActive
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-border bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {org.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => openEdit(org)}
                      aria-label="Edit organization"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-destructive"
                      onClick={() => handleDelete(org)}
                      aria-label="Delete organization"
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

      <OrganizationDialog
        open={open}
        onOpenChange={setOpen}
        editingOrg={editingOrg}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />

      {ConfirmDialogEl}
    </>
  );
}

export const OrganizationsTable: FC = () => (
  <Suspense>
    <OrganizationsTableInner />
  </Suspense>
);
