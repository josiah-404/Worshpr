import { type ColumnDef } from '@tanstack/react-table';
import { Building2, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrganizationRow } from '@/types';

export interface OrganizationColumnsContext {
  onEdit: (org: OrganizationRow) => void;
  onDelete: (org: OrganizationRow) => void;
  onToggleActive: (org: OrganizationRow) => void;
}

export function getOrganizationColumns(
  ctx: OrganizationColumnsContext,
): ColumnDef<OrganizationRow>[] {
  const { onEdit, onDelete, onToggleActive } = ctx;

  return [
    {
      id: 'organization',
      header: 'Organization',
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex items-center gap-3">
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
            <span className="font-medium">{org.name}</span>
          </div>
        );
      },
    },
    {
      id: 'members',
      header: 'Members',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{row.original._count.memberships}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const org = row.original;
        return (
          <button type="button" onClick={() => onToggleActive(org)}>
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer',
                org.isActive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
              )}
            >
              {org.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="space-x-1 text-right">
            <Button variant="ghost" size="icon" onClick={() => onEdit(org)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(org)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
