import { type ColumnDef } from '@tanstack/react-table';
import { Mail, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

const ROLE_BADGE_CLASS: Record<string, string> = {
  super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  org_admin: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20',
  officer: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  officer: 'Officer',
};

function getDisplayRole(user: User, activeOrgId: string | null): string {
  if (user.isSuperAdmin) return 'super_admin';
  if (!activeOrgId) {
    const highest = user.memberships.find((m) => m.role === 'org_admin');
    return highest?.role ?? user.memberships[0]?.role ?? 'officer';
  }
  const active = user.memberships.find((m) => m.orgId === activeOrgId);
  return active?.role ?? user.memberships[0]?.role ?? 'officer';
}

function getDisplayTitle(user: User, activeOrgId: string | null): string | null {
  if (user.isSuperAdmin) return null;
  if (!activeOrgId) {
    return user.memberships[0]?.title ?? null;
  }
  const active = user.memberships.find((m) => m.orgId === activeOrgId);
  return active?.title ?? null;
}

export interface UserColumnsContext {
  activeOrgId: string | null;
  orgMap: Record<string, string>;
  emailingId: string | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResend: (user: User) => void;
  onReset: (user: User) => void;
}

export function getUserColumns(ctx: UserColumnsContext): ColumnDef<User>[] {
  const { activeOrgId, orgMap, emailingId, onEdit, onDelete, onResend, onReset } = ctx;

  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: 'organizations',
      header: 'Organizations',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {user.isSuperAdmin ? (
              <Badge variant="outline" className="text-xs">Platform</Badge>
            ) : (
              user.memberships.map((m) => (
                <Badge key={m.orgId} variant="secondary" className="text-xs">
                  {m.orgName ?? orgMap[m.orgId] ?? m.orgId}
                </Badge>
              ))
            )}
          </div>
        );
      },
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const displayRole = getDisplayRole(row.original, activeOrgId);
        return (
          <Badge variant="outline" className={ROLE_BADGE_CLASS[displayRole]}>
            {ROLE_LABEL[displayRole] ?? displayRole}
          </Badge>
        );
      },
    },
    {
      id: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const displayTitle = getDisplayTitle(row.original, activeOrgId);
        return (
          <span className="text-muted-foreground">{displayTitle ?? '—'}</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
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
        const user = row.original;
        return (
          <div className="space-x-1 text-right">
            {!user.isSetup ? (
              <Button
                variant="ghost"
                size="icon"
                title="Resend setup email"
                disabled={emailingId === user.id}
                onClick={() => onResend(user)}
                className="text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              >
                <Mail className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                title="Send password reset"
                disabled={emailingId === user.id}
                onClick={() => onReset(user)}
                className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(user)}
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

export { getDisplayRole, getDisplayTitle, ROLE_BADGE_CLASS, ROLE_LABEL };
