'use client';

import { useState, useMemo, type FC } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useUsers, EMPTY_USER_FORM } from '@/hooks/useUsers';
import { UserDialog } from '@/app/users/UserDialog';
<<<<<<< Updated upstream
import type { User, UserFormState } from '@/types';
=======
import { useOrgContext } from '@/providers/OrgContext';
import type { User, UserFormState, Organization } from '@/types';
>>>>>>> Stashed changes

interface UsersTableProps {
  initialUsers: User[];
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20',
  MEDIA: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20',
};

export const UsersTable: FC<UsersTableProps> = ({ initialUsers }) => {
  const { users, loading, error, setError, createUser, updateUser, deleteUser } =
    useUsers(initialUsers);

  const { activeOrgId } = useOrgContext();
  const visibleUsers = useMemo(
    () => (activeOrgId ? users.filter((u) => u.orgId === activeOrgId) : users),
    [users, activeOrgId],
  );

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);

<<<<<<< Updated upstream
=======
  const orgMap = useMemo(
    () => Object.fromEntries(organizations.map((o) => [o.id, o.name])),
    [organizations],
  );

>>>>>>> Stashed changes
  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_USER_FORM);
    setError('');
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '' });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, form);
      } else {
        await createUser(form);
      }
      setOpen(false);
    } catch {
      // error is already set by the hook
    }
  }

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
        enableSorting: true,
      },
      {
        id: 'organization',
        accessorFn: (row) => (row.orgId ? (orgMap[row.orgId] ?? '') : ''),
        header: 'Organization',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.orgId ? (orgMap[row.original.orgId] ?? '—') : '—'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="outline" className={ROLE_BADGE_CLASS[row.original.role]}>
            {ROLE_LABEL[row.original.role] ?? row.original.role}
          </Badge>
        ),
        filterFn: 'equalsString',
        enableSorting: false,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.title ?? '—'}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
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
              onClick={() => deleteUser(row.original.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [orgMap, openEdit, deleteUser],
  );

  return (
    <>
<<<<<<< Updated upstream
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {users.length} member{users.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground uppercase text-xs tracking-wider">
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Email</th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Joined</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No users yet. Add your first team member.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={ROLE_BADGE_CLASS[user.role]}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteUser(user.id)}
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
=======
      <DataTable
        columns={columns}
        data={visibleUsers}
        searchPlaceholder="Search by name or email…"
        filters={[
          {
            columnId: 'role',
            placeholder: 'All Roles',
            options: [
              { label: 'Super Admin', value: 'super_admin' },
              { label: 'Org Admin', value: 'org_admin' },
              { label: 'Officer', value: 'officer' },
            ],
          },
        ]}
        toolbarRight={
          <Button onClick={openCreate} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
        emptyMessage="No users found."
      />
>>>>>>> Stashed changes

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        editingUser={editingUser}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </>
  );
};
