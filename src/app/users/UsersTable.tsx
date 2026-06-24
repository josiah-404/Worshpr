'use client';

import { Suspense, useState, type FC } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { PlusCircle, Mail, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from '@/components/table/Search';
import { Pagination } from '@/components/table/Pagination';
import { ResponsiveTableLayout } from '@/components/table/ResponsiveTableLayout';
import { getUserColumns, getDisplayRole, ROLE_BADGE_CLASS, ROLE_LABEL } from '@/components/users/UserColumns';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { useGetUsers } from '@/hooks/useGetUsers';
import { useUsers, EMPTY_USER_FORM } from '@/hooks/useUsers';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgContext } from '@/providers/OrgContext';
import { UserDialog } from '@/app/users/UserDialog';
import type { User, UserFormState, Organization } from '@/types';

const PAGE_SIZE = 10;

interface UsersTableProps {
  organizations: Organization[];
  actorIsSuperAdmin: boolean;
}

function UsersTableInner({ organizations, actorIsSuperAdmin }: UsersTableProps) {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const query = searchParams.get('query') ?? '';

  const { data: session } = useSession();
  const { activeOrgId } = useOrgContext();
  const { data, isLoading } = useGetUsers({ page, page_size: PAGE_SIZE, query });
  const { loading, error, setError, createUser, updateUser, deleteUser, resendOnboarding, sendPasswordReset } =
    useUsers();
  const { columnFilters } = useSearchFilter('name');

  const [sorting, setSorting] = useState<SortingState>([]);
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
    description: "A password reset link will be sent to the user's email address.",
    confirmLabel: 'Send',
    variant: 'default',
  });

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);

  const users: User[] = data?.data ?? [];
  const meta = data?.meta;
  const orgMap = Object.fromEntries(organizations.map((o) => [o.id, o.name]));

  function openCreate() {
    setEditingUser(null);
    setForm({
      ...EMPTY_USER_FORM,
      memberships: [{ orgId: organizations[0]?.id ?? '', role: 'officer', title: '' }],
    });
    setError('');
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      password: '',
      memberships: user.memberships.map((m) => ({
        orgId: m.orgId,
        role: m.role,
        title: m.title ?? '',
      })),
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

  const canManageUsers =
    session?.user?.isSuperAdmin ||
    session?.user?.orgMemberships?.some((m) => m.role === 'org_admin');

  const columns = getUserColumns({
    activeOrgId,
    orgMap,
    emailingId,
    onEdit: openEdit,
    onDelete: handleDelete,
    onResend: handleResendOnboarding,
    onReset: handleSendPasswordReset,
  });

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta?.totalPages ?? 1,
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total ?? 0} user{(meta?.total ?? 0) !== 1 ? 's' : ''}
        </p>
        {canManageUsers && (
          <Button onClick={openCreate} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Search placeholder="Search users by name or email..." />
      </div>

      <ResponsiveTableLayout
        table={table}
        columns={columns}
        isLoading={isLoading}
        loadingRows={PAGE_SIZE}
        noRecordMessage="No users found. Try a different search or add your first team member."
        renderMobileRow={(row: Row<User>) => {
          const user = row.original;
          const displayRole = getDisplayRole(user, activeOrgId);
          return (
            <div className="flex min-h-[3.5rem] items-center gap-2 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-xs ${ROLE_BADGE_CLASS[displayRole]}`}>
                {ROLE_LABEL[displayRole] ?? displayRole}
              </Badge>
              <div className="flex shrink-0 items-center gap-0.5">
                {!user.isSetup ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-amber-400"
                    disabled={emailingId === user.id}
                    onClick={() => handleResendOnboarding(user)}
                    aria-label="Resend setup email"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-blue-400"
                    disabled={emailingId === user.id}
                    onClick={() => handleSendPasswordReset(user)}
                    aria-label="Send password reset"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => openEdit(user)}
                  aria-label="Edit user"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 text-destructive"
                  onClick={() => handleDelete(user)}
                  aria-label="Delete user"
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
        actorIsSuperAdmin={actorIsSuperAdmin}
      />

      {ConfirmDialogEl}
      {ConfirmResendEl}
      {ConfirmResetEl}
    </>
  );
}

export const UsersTable: FC<UsersTableProps> = (props) => (
  <Suspense>
    <UsersTableInner {...props} />
  </Suspense>
);
