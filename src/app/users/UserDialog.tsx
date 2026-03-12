'use client';

import { type FC } from 'react';
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
import type { User, UserFormState } from '@/types';

const ROLES = ['ADMIN', 'MEDIA'] as const;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  form: UserFormState;
  onFormChange: (form: UserFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
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
}) => {
  const set = (patch: Partial<UserFormState>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          {!editingUser && (
            <p className="text-sm text-muted-foreground mt-1">
              An onboarding email with a setup link will be sent to the user.
            </p>
          )}
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
              onValueChange={(v) => set({ role: v as UserFormState['role'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {editingUser && (
            <FormField
              label="Password"
              htmlFor="password"
              hint="(leave blank to keep current)"
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
              />
            </FormField>
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
