'use client';

import { useState, type FC } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUsers, EMPTY_USER_FORM } from '@/hooks/useUsers';
import { UserDialog } from '@/app/users/UserDialog';
import type { User, UserFormState, Organization } from '@/types';

interface UsersTableProps {
  initialUsers: User[];
  organizations: Organization[];
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  org_admin:   'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20',
  officer:     'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin:   'Org Admin',
  officer:     'Officer',
};

export const UsersTable: FC<UsersTableProps> = ({ initialUsers, organizations }) => {
  const { users, loading, error, setError, createUser, updateUser, deleteUser } =
    useUsers(initialUsers);

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);

  const orgMap = Object.fromEntries(organizations.map((o) => [o.id, o.name]));

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_USER_FORM);
    setError('');
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      orgId: user.orgId ?? '',
      title: user.title ?? '',
    });
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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''}
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
              <th className="px-6 py-3 text-left font-medium">Organization</th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Title</th>
              <th className="px-6 py-3 text-left font-medium">Joined</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No users yet. Add your first team member.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.orgId ? orgMap[user.orgId] ?? '—' : '—'}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={ROLE_BADGE_CLASS[user.role]}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.title ?? '—'}
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

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        editingUser={editingUser}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        organizations={organizations}
      />
    </>
  );
};
