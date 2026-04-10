'use client';

import { useState, useEffect, type FC } from 'react';
import { QrCode, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useCreatePaymentAccount } from '@/hooks/useCreatePaymentAccount';
import { useUpdatePaymentAccount } from '@/hooks/useUpdatePaymentAccount';
import { toast } from 'sonner';
import type { PaymentAccount } from '@/types';

const METHOD_LABELS: Record<string, string> = {
  GCASH: 'GCash',
  MAYA: 'Maya',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

interface PaymentAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PaymentAccount | null;
  orgId: string;
}

interface FormState {
  method: string;
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string;
  instructions: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  method: '',
  label: '',
  accountName: '',
  accountNumber: '',
  bankName: '',
  qrCodeUrl: '',
  instructions: '',
  isActive: true,
};

export const PaymentAccountDialog: FC<PaymentAccountDialogProps> = ({
  open,
  onOpenChange,
  editing,
  orgId,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useLogoUpload();

  const { mutate: create, isPending: creating } = useCreatePaymentAccount();
  const { mutate: update, isPending: updating } = useUpdatePaymentAccount();
  const isPending = creating || updating || uploading;

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          method: editing.method,
          label: editing.label,
          accountName: editing.accountName,
          accountNumber: editing.accountNumber,
          bankName: editing.bankName ?? '',
          qrCodeUrl: editing.qrCodeUrl ?? '',
          instructions: editing.instructions ?? '',
          isActive: editing.isActive,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.method || !form.label || !form.accountName || !form.accountNumber) return;

    const payload = {
      method: form.method as 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'OTHER',
      label: form.label,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      bankName: form.bankName || undefined,
      qrCodeUrl: form.qrCodeUrl || undefined,
      instructions: form.instructions || undefined,
      isActive: form.isActive,
    };

    if (editing) {
      update(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Payment account updated');
            onOpenChange(false);
          },
          onError: () => toast.error('Failed to update payment account'),
        },
      );
    } else {
      create(
        { ...payload, orgId },
        {
          onSuccess: () => {
            toast.success('Payment account created');
            onOpenChange(false);
          },
          onError: () => toast.error('Failed to create payment account'),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Payment Account' : 'Add Payment Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">

          {/* QR Code Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) =>
              handleFileChange(e, form.qrCodeUrl, (url) => set({ qrCodeUrl: url }))
            }
          />

          <div className="flex items-start gap-4">
            {/* QR thumb */}
            <button
              type="button"
              disabled={uploading}
              onClick={triggerFilePicker}
              className={cn(
                'group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl',
                'border-2 border-dashed border-border bg-muted/40 overflow-hidden',
                'transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60',
              )}
            >
              {form.qrCodeUrl ? (
                <img src={form.qrCodeUrl} alt="QR Code" className="h-full w-full object-cover" />
              ) : (
                <QrCode className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              {!uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus className="h-4 w-4 text-white" />
                  <span className="text-[10px] font-medium text-white">
                    {form.qrCodeUrl ? 'Change' : 'Upload'}
                  </span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-[11px] font-semibold text-white">{uploadProgress}%</span>
                </div>
              )}
            </button>

            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">QR Code (optional)</p>
              <p className="text-[11px] text-muted-foreground/60">PNG, JPG, WEBP — max 4 MB</p>
              {form.qrCodeUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => set({ qrCodeUrl: '' })}
                  className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors"
                >
                  <X className="h-3 w-3" /> Remove QR
                </button>
              )}
            </div>
          </div>

          {/* Method + Label */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Method" htmlFor="pa-method">
              <Select
                value={form.method}
                onValueChange={(v) => set({ method: v })}
              >
                <SelectTrigger id="pa-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Label" htmlFor="pa-label">
              <Input
                id="pa-label"
                required
                placeholder="e.g. Church GCash"
                value={form.label}
                onChange={(e) => set({ label: e.target.value })}
              />
            </FormField>
          </div>

          {/* Account Name + Number */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Account Name" htmlFor="pa-account-name">
              <Input
                id="pa-account-name"
                required
                placeholder="Juan Dela Cruz"
                value={form.accountName}
                onChange={(e) => set({ accountName: e.target.value })}
              />
            </FormField>

            <FormField label="Account Number / Mobile" htmlFor="pa-account-number">
              <Input
                id="pa-account-number"
                required
                placeholder="09XX XXX XXXX"
                value={form.accountNumber}
                onChange={(e) => set({ accountNumber: e.target.value })}
              />
            </FormField>
          </div>

          {/* Bank Name (only for Bank Transfer / Other) */}
          {(form.method === 'BANK_TRANSFER' || form.method === 'OTHER') && (
            <FormField label="Bank Name" htmlFor="pa-bank-name" hint="(optional)">
              <Input
                id="pa-bank-name"
                placeholder="e.g. BDO, BPI, UnionBank"
                value={form.bankName}
                onChange={(e) => set({ bankName: e.target.value })}
              />
            </FormField>
          )}

          {/* Instructions */}
          <FormField label="Payment Instructions" htmlFor="pa-instructions" hint="(optional)">
            <Textarea
              id="pa-instructions"
              rows={3}
              placeholder="e.g. Send exact amount. Use your full name as reference."
              value={form.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              className="resize-none"
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
