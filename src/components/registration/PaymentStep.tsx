'use client';

import { type FC, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Upload, Loader2 } from 'lucide-react';
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
import type { RegistrationGroupInput } from '@/validations/registration.schema';
import type { PublicEventData } from '@/types';

interface PaymentStepProps {
  event: PublicEventData;
}

const PAYMENT_METHODS = [
  { value: 'GCASH', label: 'GCash' },
  { value: 'MAYA', label: 'Maya' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash (Pay on-site)' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PaymentStep: FC<PaymentStepProps> = ({ event }) => {
  const form = useFormContext<RegistrationGroupInput>();
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useReceiptUpload();

  const paymentIntent = useWatch({ control: form.control, name: 'paymentIntent' });
  const headcount = useWatch({ control: form.control, name: 'registrants' })?.length ?? 1;
  const totalFee = event.fee * headcount;

  const isFree = event.fee === 0;

  // When switching to ONLINE, initialize payment fields so form state is populated
  useEffect(() => {
    if (paymentIntent === 'ONLINE') {
      form.setValue('payment.amount', totalFee);
    }
  }, [paymentIntent, totalFee, form]);

  return (
    <div className="space-y-6">
      {/* Fee summary */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee per person</span>
          <span>{isFree ? 'Free' : `₱${event.fee.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Registrants</span>
          <span>{headcount}</span>
        </div>
        {!isFree && (
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>₱{totalFee.toFixed(2)}</span>
          </div>
        )}
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
              {/* Payment method */}
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
                        {PAYMENT_METHODS.filter((m) => m.value !== 'CASH').map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount (auto-filled) */}
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
