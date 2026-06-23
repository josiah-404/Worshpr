'use client';

import { type FC, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Upload, Loader2, Copy, QrCode, Smartphone, Building2, CreditCard, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReceiptUpload } from '@/hooks/useReceiptUpload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RegistrationGroupInput } from '@/validations/registration.schema';
import type { PublicEventData, PaymentAccountSummary } from '@/types';

interface PaymentStepProps {
  event: PublicEventData;
}

const METHOD_LABELS: Record<string, string> = {
  GCASH: 'GCash',
  MAYA: 'Maya',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  GCASH: Smartphone,
  MAYA: Smartphone,
  BANK_TRANSFER: Building2,
  OTHER: CreditCard,
};

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() =>
      toast.success(`${label} copied`),
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-semibold truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </button>
    </div>
  );
}

function PaymentAccountCard({ account }: { account: PaymentAccountSummary }) {
  const Icon = METHOD_ICONS[account.method] ?? CreditCard;

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4 bg-muted/40 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{account.label}</p>
          <p className="text-xs text-muted-foreground">{METHOD_LABELS[account.method] ?? account.method}</p>
        </div>
      </div>

      {/* Account details */}
      <div className="px-4 sm:px-5 py-4 space-y-2.5">
        <CopyField label="Account Name" value={account.accountName} />
        <CopyField
          label={account.method === 'BANK_TRANSFER' ? 'Account Number' : 'Mobile Number'}
          value={account.accountNumber}
          mono
        />
        {account.bankName && (
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Bank</p>
            <p className="text-sm font-semibold">{account.bankName}</p>
          </div>
        )}
      </div>

      {/* QR code — centered */}
      {account.qrCodeUrl && (
        <div className="px-4 sm:px-5 pb-4 flex flex-col items-center gap-3">
          <div className="w-full border-t" />
          <p className="text-xs text-muted-foreground self-start">Scan QR Code</p>
          <img
            src={account.qrCodeUrl}
            alt="QR Code"
            className="w-full max-w-[176px] rounded-xl border object-contain p-1 bg-white"
          />
          <a
            href={account.qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <QrCode className="h-3.5 w-3.5" /> Open full QR
          </a>
        </div>
      )}

      {/* Instructions */}
      {account.instructions && (
        <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-lg border border-dashed px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Payment Instructions</p>
          <p className="text-sm leading-relaxed">{account.instructions}</p>
        </div>
      )}
    </div>
  );
}

export const PaymentStep: FC<PaymentStepProps> = ({ event }) => {
  const form = useFormContext<RegistrationGroupInput>();
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useReceiptUpload();

  const paymentIntent = useWatch({ control: form.control, name: 'paymentIntent' });
  const registrants = useWatch({ control: form.control, name: 'registrants' }) ?? [];
  const feeItems = event.feeItems;
  const requiredIds = feeItems.filter((i) => i.isRequired).map((i) => i.id);

  function registrantTotal(selectedIds: string[] | undefined): number {
    const ids = selectedIds ?? [];
    return feeItems.filter((i) => ids.includes(i.id)).reduce((sum, i) => sum + i.amount, 0);
  }

  const totalFee = registrants.reduce((sum, r) => sum + registrantTotal(r.selectedFeeItemIds), 0);
  const isFree = totalFee === 0;
  const paymentAccount = event.paymentAccount;

  // Required fee items must always be included, regardless of what the registrant toggles
  useEffect(() => {
    registrants.forEach((r, i) => {
      const current = r.selectedFeeItemIds ?? [];
      const merged = Array.from(new Set([...current, ...requiredIds]));
      if (merged.length !== current.length) {
        form.setValue(`registrants.${i}.selectedFeeItemIds`, merged);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeItems, registrants.length]);

  function toggleFeeItem(index: number, itemId: string) {
    const current = form.getValues(`registrants.${index}.selectedFeeItemIds`) ?? [];
    const next = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    form.setValue(`registrants.${index}.selectedFeeItemIds`, next);
  }

  // Auto-set amount and method when switching to ONLINE
  useEffect(() => {
    if (paymentIntent === 'ONLINE') {
      form.setValue('payment.amount', totalFee);
      if (paymentAccount) {
        form.setValue('payment.method', paymentAccount.method as 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'OTHER');
      }
    }
  }, [paymentIntent, totalFee, paymentAccount, form]);

  return (
    <div className="space-y-6">
      {/* Fee item selection per registrant */}
      {feeItems.length > 0 && (
        <div className="space-y-3">
          {registrants.map((r, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-2.5">
              <p className="text-sm font-semibold">
                {r.fullName || `Registrant ${index + 1}`}
              </p>
              <div className="space-y-1.5">
                {feeItems.map((item) => {
                  const selected = (r.selectedFeeItemIds ?? []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.isRequired}
                      onClick={() => toggleFeeItem(index, item.id)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-default',
                        selected
                          ? 'bg-primary/10 border-primary/20'
                          : 'border-transparent hover:bg-muted/50',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        {item.label}
                        {item.isRequired && (
                          <span className="text-xs text-muted-foreground">(Required)</span>
                        )}
                      </span>
                      <span className="font-medium">₱{item.amount.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Subtotal</span>
                <span>₱{registrantTotal(r.selectedFeeItemIds).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{isFree ? 'Free' : `₱${totalFee.toFixed(2)}`}</span>
        </div>
      </div>

      {isFree ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          This event is free — no payment required.
        </p>
      ) : (
        <>
          {/* Payment intent */}
          <FormField
            control={form.control}
            name="paymentIntent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Option</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select how you'll pay" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ONLINE">Pay Online Now</SelectItem>
                    <SelectItem value="CASH">Pay Cash On-site</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {paymentIntent === 'ONLINE' && (
            <div className="space-y-4">
              {/* Payment account info card */}
              {paymentAccount ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Send Payment To
                  </p>
                  <PaymentAccountCard account={paymentAccount} />
                </div>
              ) : (
                /* Fallback: method selector when no account linked */
                <FormField
                  control={form.control}
                  name="payment.method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GCASH">GCash</SelectItem>
                          <SelectItem value="MAYA">Maya</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Amount (auto-filled, read-only) */}
              <FormField
                control={form.control}
                name="payment.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        readOnly
                        {...field}
                        value={field.value ?? totalFee}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference number */}
              <FormField
                control={form.control}
                name="payment.referenceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt upload */}
              <FormField
                control={form.control}
                name="payment.receiptUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Receipt</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(e, (url) => field.onChange(url))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={triggerFilePicker}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {field.value ? 'Replace Receipt' : 'Upload Receipt'}
                            </>
                          )}
                        </Button>
                        {field.value && (
                          <p className="text-xs text-muted-foreground truncate">
                            Uploaded: {field.value}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
