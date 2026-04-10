'use client';

import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useCreateChurch } from '@/hooks/useCreateChurch';
import { useUpdateChurch } from '@/hooks/useUpdateChurch';
import type { Church, Organization } from '@/types';

// ─── Schema ────────────────────────────────────────────────────────────────

const churchFormSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Church name is required'),
  location: z.string().optional(),
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

interface ChurchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Church | null;
  defaultOrgId: string;
  isSuperAdmin: boolean;
  organizations: Organization[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const ChurchDialog: FC<ChurchDialogProps> = ({
  open,
  onOpenChange,
  editing,
  defaultOrgId,
  isSuperAdmin,
  organizations,
}) => {
  const { mutate: createChurch, isPending: isCreating } = useCreateChurch();
  const { mutate: updateChurch, isPending: isUpdating } = useUpdateChurch();
  const isPending = isCreating || isUpdating;

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema),
    defaultValues: { orgId: defaultOrgId, name: '', location: '' },
  });

  useEffect(() => {
    if (editing) {
      form.reset({ orgId: editing.orgId, name: editing.name, location: editing.location ?? '' });
    } else {
      form.reset({ orgId: defaultOrgId, name: '', location: '' });
    }
  }, [editing, open, defaultOrgId, form]);

  const onSubmit = (values: ChurchFormValues) => {
    if (editing) {
      updateChurch(
        { id: editing.id, data: { name: values.name, location: values.location || undefined } },
        {
          onSuccess: () => { toast.success('Church updated'); onOpenChange(false); },
          onError: () => toast.error('Failed to update church'),
        },
      );
    } else {
      createChurch(
        { orgId: values.orgId, name: values.name, location: values.location || undefined },
        {
          onSuccess: () => { toast.success('Church created'); onOpenChange(false); },
          onError: () => toast.error('Failed to create church'),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Church' : 'Add Church'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSuperAdmin && (
              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!editing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Church Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Victory Alabang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Location <span className="text-muted-foreground text-xs">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alabang, Muntinlupa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Church'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
