import { type ColumnDef } from '@tanstack/react-table';
import { Church as ChurchIcon, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Church } from '@/types';

export interface ChurchColumnsContext {
  isSuperAdmin: boolean;
  onEdit: (church: Church) => void;
  onDelete: (church: Church) => void;
  onToggleActive: (church: Church) => void;
}

export function getChurchColumns(ctx: ChurchColumnsContext): ColumnDef<Church>[] {
  const { isSuperAdmin, onEdit, onDelete, onToggleActive } = ctx;

  const columns: ColumnDef<Church>[] = [
    {
      id: 'church',
      header: 'Church',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <ChurchIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
  ];

  if (isSuperAdmin) {
    columns.push({
      id: 'organization',
      header: 'Organization',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.orgName}</span>
      ),
    });
  }

  columns.push(
    {
      id: 'location',
      header: 'Location',
      meta: { className: 'hidden sm:table-cell' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.location ?? (
            <span className="italic text-muted-foreground/40">—</span>
          )}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const church = row.original;
        return (
          <button type="button" onClick={() => onToggleActive(church)}>
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer',
                church.isActive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
              )}
            >
              {church.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const church = row.original;
        return (
          <div className="space-x-1 text-right">
            <Button variant="ghost" size="icon" onClick={() => onEdit(church)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(church)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  );

  return columns;
}
