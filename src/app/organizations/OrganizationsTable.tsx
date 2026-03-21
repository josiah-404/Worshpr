'use client';

import { useState, type FC } from 'react';
import { PlusCircle, Pencil, Trash2, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOrganizations, EMPTY_ORG_FORM } from '@/hooks/useOrganizations';
import { useConfirm } from '@/hooks/useConfirm';
import { OrganizationDialog } from '@/app/organizations/OrganizationDialog';
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

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Organization',
    description: 'This will permanently delete the organization and cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

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

  async function handleDelete(org: OrganizationRow) {
    const ok = await confirm();
    if (!ok) return;
    await deleteOrganization(org.id);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center gap-3">
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
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground uppercase text-xs tracking-wider">
                <th className="px-6 py-3 text-left font-medium">Organization</th>
                <th className="px-6 py-3 text-left font-medium">Members</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Created</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(organizations as OrganizationRow[]).map((org) => (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="h-8 w-8 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{org._count.users}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(org)}>
                      <Badge
                        variant="outline"
                        className={cn(
                          'cursor-pointer',
                          org.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                        )}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(org)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(org)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
};
