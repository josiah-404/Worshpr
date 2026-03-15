'use client';

import { useState, useMemo, type FC } from 'react';
import { PlusCircle, Pencil, Trash2, Building2, Users } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/common/DataTable';
import { useOrganizations, EMPTY_ORG_FORM } from '@/hooks/useOrganizations';
import { OrganizationDialog } from '@/app/organizations/OrganizationDialog';
import { useOrgContext } from '@/providers/OrgContext';
import type { OrganizationRow, OrganizationFormState } from '@/types';

interface OrganizationsTableProps {
  initialOrgs: OrganizationRow[];
}

export const OrganizationsTable: FC<OrganizationsTableProps> = ({ initialOrgs }) => {
  const {
    organizations,
    loading,
    error,
    setError,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  } = useOrganizations(initialOrgs);

  const { activeOrgId } = useOrgContext();
  const visibleOrgs = useMemo(
    () => (activeOrgId ? organizations.filter((o) => o.id === activeOrgId) : organizations),
    [organizations, activeOrgId],
  );

  const [open, setOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRow | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_ORG_FORM);

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

  const columns: ColumnDef<OrganizationRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Organization',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logoUrl ? (
              <img
                src={row.original.logoUrl}
                alt={row.original.name}
                className="h-8 w-8 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: 'members',
        accessorFn: (row) => row._count.users,
        header: 'Members',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{row.original._count.users}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: 'status',
        accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
        header: 'Status',
        cell: ({ row }) => (
          <button onClick={() => handleToggleActive(row.original)}>
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer',
                row.original.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        ),
        filterFn: 'equalsString',
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteOrganization(row.original.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [handleToggleActive, openEdit, deleteOrganization],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No organizations yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Create your first organization to get started.
        </p>
      </div>
      <Button onClick={openCreate} size="sm" variant="outline">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
      </Button>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={visibleOrgs}
        searchPlaceholder="Search organizations…"
        filters={[
          {
            columnId: 'status',
            placeholder: 'All Statuses',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        toolbarRight={
          <Button onClick={openCreate} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
          </Button>
        }
        emptyState={emptyState}
      />

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
    </>
  );
};
