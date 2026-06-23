'use client';

import { useState, useEffect, type FC } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OFFICER_TITLES, EMPTY_MEMBERSHIP } from '@/lib/constants';
import type { User, UserFormState, UserMembershipForm, Organization } from '@/types';

const MEMBERSHIP_ROLES: { value: UserMembershipForm['role']; label: string }[] = [
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'officer', label: 'Officer' },
];

const PREDEFINED_TITLES = OFFICER_TITLES.filter((t) => t !== 'Other') as readonly string[];

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  form: UserFormState;
  onFormChange: (form: UserFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  organizations: Organization[];
  actorIsSuperAdmin: boolean;
}

export const UserDialog: FC<UserDialogProps> = ({
  open,
  onOpenChange,
  editingUser,
  form,
  onFormChange,
  onSubmit,
  loading,
  error,
  organizations,
  actorIsSuperAdmin,
}) => {
  const { data: session } = useSession();
  const set = (patch: Partial<UserFormState>) => onFormChange({ ...form, ...patch });

  const [titleSelectValues, setTitleSelectValues] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitleSelectValues(
      form.memberships.map((m) => {
        if (!m.title) return '';
        if (PREDEFINED_TITLES.includes(m.title)) return m.title;
        return 'other';
      }),
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function addMembership() {
    set({ memberships: [...form.memberships, { ...EMPTY_MEMBERSHIP }] });
    setTitleSelectValues((prev) => [...prev, '']);
  }

  function removeMembership(index: number) {
    set({
      memberships: form.memberships.filter((_, i) => i !== index),
    });
    setTitleSelectValues((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMembership(index: number, patch: Partial<UserMembershipForm>) {
    const next = form.memberships.map((m, i) =>
      i === index ? { ...m, ...patch } : m,
    );
    set({ memberships: next });
  }

  function handleTitleSelectChange(index: number, value: string) {
    setTitleSelectValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value === 'other') {
      updateMembership(index, { title: '' });
    } else {
      updateMembership(index, { title: value });
    }
  }

  function handleSuperAdminChange(checked: boolean) {
    set({
      isSuperAdmin: checked,
      memberships: checked ? [] : [{ ...EMPTY_MEMBERSHIP }],
    });
    if (!checked) setTitleSelectValues(['']);
  }

  const actorManageableOrgIds = actorIsSuperAdmin
    ? organizations.map((o) => o.id)
    : (session?.user?.orgMemberships ?? [])
        .filter((m) => m.role === 'org_admin')
        .map((m) => m.orgId);

  const selectableOrgs = organizations.filter((o) =>
    actorManageableOrgIds.includes(o.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <FormField label="Full Name" htmlFor="name">
            <Input
              id="name"
              required
              placeholder="e.g. John Santos"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </FormField>

          <FormField label="Email Address" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              placeholder="e.g. john@church.com"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </FormField>

          {actorIsSuperAdmin && (
            <div className="flex items-center gap-2">
              <input
                id="isSuperAdmin"
                type="checkbox"
                checked={form.isSuperAdmin}
                onChange={(e) => handleSuperAdminChange(e.target.checked)}
                className="h-4 w-4 rounded border border-input"
              />
              <Label htmlFor="isSuperAdmin" className="text-sm font-normal cursor-pointer">
                Super Admin (platform-wide access)
              </Label>
            </div>
          )}

          {!form.isSuperAdmin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Organization Memberships</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMembership}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Org
                </Button>
              </div>

              {form.memberships.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add at least one organization membership.
                </p>
              )}

              {form.memberships.map((membership, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-3 space-y-3 relative"
                >
                  {form.memberships.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-destructive"
                      onClick={() => removeMembership(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <FormField label="Organization">
                    <Select
                      required
                      value={membership.orgId}
                      onValueChange={(v) => updateMembership(index, { orgId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableOrgs.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Role">
                    <Select
                      value={membership.role}
                      onValueChange={(v) =>
                        updateMembership(index, {
                          role: v as UserMembershipForm['role'],
                          title: v === 'officer' ? membership.title : '',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBERSHIP_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {membership.role === 'officer' && (
                    <>
                      <FormField label="Title">
                        <Select
                          value={titleSelectValues[index] ?? ''}
                          onValueChange={(v) => handleTitleSelectChange(index, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                          <SelectContent>
                            {OFFICER_TITLES.map((t) => (
                              <SelectItem key={t} value={t === 'Other' ? 'other' : t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      {titleSelectValues[index] === 'other' && (
                        <FormField label="Specify Title" htmlFor={`title-custom-${index}`}>
                          <Input
                            id={`title-custom-${index}`}
                            required
                            placeholder="e.g. Worship Leader"
                            value={membership.title}
                            onChange={(e) => updateMembership(index, { title: e.target.value })}
                          />
                        </FormField>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!editingUser && (
            <p className="text-sm text-muted-foreground bg-muted/50 border rounded-md px-3 py-2">
              An onboarding email with a setup link will be sent to the user.
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
