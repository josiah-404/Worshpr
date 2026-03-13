'use client';

import { useState, useEffect, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
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
import { OFFICER_TITLES } from '@/lib/constants';
import type { User, UserFormState, Organization } from '@/types';

const ROLES: { value: UserFormState['role']; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'org_admin',   label: 'Org Admin'   },
  { value: 'officer',     label: 'Officer'      },
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
}) => {
  const set = (patch: Partial<UserFormState>) => onFormChange({ ...form, ...patch });

  // Local state to track what's selected in the title dropdown
  const [titleSelectValue, setTitleSelectValue] = useState('');

  // Sync dropdown selection whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    if (!form.title) {
      setTitleSelectValue('');
    } else if (PREDEFINED_TITLES.includes(form.title)) {
      setTitleSelectValue(form.title);
    } else {
      setTitleSelectValue('other');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsOrg = form.role !== 'super_admin';

  function handleTitleSelectChange(value: string) {
    setTitleSelectValue(value);
    if (value === 'other') {
      set({ title: '' }); // clear so user types their own
    } else {
      set({ title: value });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          <FormField label="Role">
            <Select
              value={form.role}
              onValueChange={(v) =>
                set({
                  role: v as UserFormState['role'],
                  orgId: v === 'super_admin' ? '' : form.orgId,
                  title: v !== 'officer' ? '' : form.title,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {needsOrg && (
            <FormField label="Organization">
              <Select
                required
                value={form.orgId}
                onValueChange={(v) => set({ orgId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {form.role === 'officer' && (
            <>
              <FormField label="Title">
                <Select
                  value={titleSelectValue}
                  onValueChange={handleTitleSelectChange}
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

              {titleSelectValue === 'other' && (
                <FormField label="Specify Title" htmlFor="title-custom">
                  <Input
                    id="title-custom"
                    required
                    placeholder="e.g. Worship Leader"
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                </FormField>
              )}
            </>
          )}

          <FormField
            label="Password"
            htmlFor="password"
            hint={editingUser ? '(leave blank to keep current)' : undefined}
          >
            <Input
              id="password"
              type="password"
              required={!editingUser}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
            />
          </FormField>

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
