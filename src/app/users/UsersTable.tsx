'use client';

import { useState, type FC } from 'react';
import { PlusCircle, Pencil, Trash2, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUsers, EMPTY_USER_FORM } from '@/hooks/useUsers';
import { useConfirm } from '@/hooks/useConfirm';
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
  const { users, loading, error, setError, createUser, updateUser, deleteUser, resendOnboarding, sendPasswordReset } =
    useUsers(initialUsers);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Remove User',
    description: 'This will permanently remove the user from the system.',
    confirmLabel: 'Remove',
    variant: 'destructive',
  });

  const [confirmResend, ConfirmResendEl] = useConfirm({
    title: 'Resend Setup Email',
    description: 'This will invalidate the previous setup link and send a new one to the user.',
    confirmLabel: 'Send',
    variant: 'default',
  });

  const [confirmReset, ConfirmResetEl] = useConfirm({
    title: 'Send Password Reset',
    description: 'A password reset link will be sent to the user\'s email address.',
    confirmLabel: 'Send',
    variant: 'default',
  });

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

  async function handleDelete(user: User) {
    const ok = await confirm();
    if (!ok) return;
    await deleteUser(user.id);
  }

  async function handleResendOnboarding(user: User) {
    const ok = await confirmResend();
    if (!ok) return;
    setEmailingId(user.id);
    await resendOnboarding(user.id, user.name);
    setEmailingId(null);
  }

  async function handleSendPasswordReset(user: User) {
    const ok = await confirmReset();
    if (!ok) return;
    setEmailingId(user.id);
    await sendPasswordReset(user.id, user.name);
    setEmailingId(null);
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No users yet. Add your first team member.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.orgId ? orgMap[user.orgId] ?? '—' : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={ROLE_BADGE_CLASS[user.role]}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.title ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {!user.isSetup ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Resend setup email"
                      disabled={emailingId === user.id}
                      onClick={() => handleResendOnboarding(user)}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Send password reset"
                      disabled={emailingId === user.id}
                      onClick={() => handleSendPasswordReset(user)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

      {ConfirmDialogEl}
      {ConfirmResendEl}
      {ConfirmResetEl}
    </>
  );
};
