'use client';

import { type FC, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateLedgerEntry } from '@/hooks/useCreateLedgerEntry';
import { useReceiptUpload } from '@/hooks/useReceiptUpload';
import { useOrgContext } from '@/providers/OrgContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, FINANCE_CATEGORY_LABELS } from '@/types/finance.types';
import { ledgerEntrySchema, type LedgerEntryInput } from '@/validations/finance.schema';
import type { EventFinanceSummaryItem } from '@/types/finance.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddEntryDialogProps {
  open: boolean;
  onClose: () => void;
  events: { id: string; title: string }[];
  defaultEventId?: string;
  defaultType?: 'INCOME' | 'EXPENSE';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddEntryDialog: FC<AddEntryDialogProps> = ({
  open, onClose, events, defaultEventId, defaultType,
}) => {
  const { mutate: createEntry, isPending } = useCreateLedgerEntry();
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } = useReceiptUpload();
  const { activeOrgId } = useOrgContext();

  const form = useForm<LedgerEntryInput>({
    resolver: zodResolver(ledgerEntrySchema) as unknown as Resolver<LedgerEntryInput>,
    defaultValues: {
      type: defaultType ?? 'EXPENSE',
      category: 'OTHER_EXPENSE',
      customCategory: '',
      amount: undefined,
      description: '',
      date: new Date().toISOString().split('T')[0],
      eventId: defaultEventId ?? '',
      payee: '',
      requestedBy: '',
      receiptUrl: '',
    },
  });

  const type = form.watch('type');
  const category = form.watch('category');
  const receiptUrl = form.watch('receiptUrl');
  const isOtherCategory = category === 'OTHER_EXPENSE' || category === 'OTHER_INCOME';

  // Reset category when type changes
  useEffect(() => {
    form.setValue('category', type === 'INCOME' ? 'OTHER_INCOME' : 'OTHER_EXPENSE');
    form.setValue('customCategory', '');
  }, [type, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const categoryOptions = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = (data: LedgerEntryInput) => {
    const isOther = data.category === 'OTHER_EXPENSE' || data.category === 'OTHER_INCOME';
    createEntry(
      {
        ...data,
        customCategory: isOther && data.customCategory ? data.customCategory : undefined,
        eventId: data.eventId || undefined,
        payee: data.payee || undefined,
        requestedBy: data.requestedBy || undefined,
        receiptUrl: data.receiptUrl || undefined,
        orgId: activeOrgId ?? undefined,
      },
      {
        onSuccess: () => { toast.success('Entry added'); onClose(); },
        onError: () => toast.error('Failed to add entry'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Finance Entry</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(['INCOME', 'EXPENSE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                          field.value === t
                            ? t === 'INCOME'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                              : 'bg-destructive/15 border-destructive/40 text-destructive'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t === 'INCOME' ? 'Income' : 'Expense'}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{FINANCE_CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₱)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || raw === '.') {
                            field.onChange(raw === '' ? undefined : raw);
                          } else {
                            const num = parseFloat(raw);
                            field.onChange(isNaN(num) ? field.value : raw);
                          }
                        }}
                        onBlur={(e) => {
                          const num = parseFloat(e.target.value);
                          field.onChange(isNaN(num) ? undefined : num);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Specify — shown only for Other Income / Other Expense */}
            {isOtherCategory && (
              <FormField
                control={form.control}
                name="customCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify {category === 'OTHER_INCOME' ? 'Income' : 'Expense'} Type</FormLabel>
                    <FormControl>
                      <Input placeholder={category === 'OTHER_INCOME' ? 'e.g. Grants, Interest...' : 'e.g. Office Rent, Utilities...'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="Brief description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date + Event */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event (optional)</FormLabel>
                    <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {events.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expense-only fields */}
            {type === 'EXPENSE' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="payee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid To (optional)</FormLabel>
                        <FormControl><Input placeholder="e.g. Jollibee" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested By (optional)</FormLabel>
                        <FormControl><Input placeholder="Officer name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Receipt */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Receipt (optional)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, (url) => form.setValue('receiptUrl', url))}
                  />
                  {receiptUrl ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">Receipt uploaded</span>
                      <button type="button" className="text-muted-foreground hover:text-foreground ml-auto shrink-0 text-xs"
                        onClick={() => form.setValue('receiptUrl', '')}>Remove</button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="gap-2 w-full"
                      onClick={triggerFilePicker} disabled={uploading}>
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {uploadProgress}%</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Upload Receipt</>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : 'Add Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
