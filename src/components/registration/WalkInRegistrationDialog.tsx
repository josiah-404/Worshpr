'use client';

import { type FC, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Banknote, Smartphone, BadgeCheck, CheckCircle2, Circle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWalkInRegistration } from '@/hooks/useWalkInRegistration';
import { useGetEventChurches } from '@/hooks/useGetEventChurches';
import { cn } from '@/lib/utils';
import type { EventOrg, EventFeeItem } from '@/types';
import type { PaymentAccountSummary } from '@/types/payment-account.types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash', GCASH: 'GCash', MAYA: 'Maya',
  BANK_TRANSFER: 'Bank Transfer', OTHER: 'Other',
};

// ─── Schema ────────────────────────────────────────────────────────────────────

const walkInFormSchema = z.object({
  fullName:             z.string().min(1, 'Full name is required'),
  email:                z.string().email('Invalid email address'),
  phone:                z.string().min(1, 'Phone number is required'),
  birthday:             z.string().min(1, 'Birthday is required'),
  nickname:             z.string().optional(),
  address:              z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone:z.string().optional(),
  divisionOrgId:        z.string().optional(),
  churchId:             z.string().optional(),
  paymentIntent:        z.enum(['CASH', 'ONLINE', 'FREE']),
  selectedFeeItemIds:   z.array(z.string()).default([]),
});

type WalkInFormValues = z.infer<typeof walkInFormSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────────

interface WalkInRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  feeItems: EventFeeItem[];
  eventOrgs: EventOrg[];
  paymentAccount: PaymentAccountSummary | null;
}

// ─── Subcomponent: Division + Church (reactive) ────────────────────────────────

const DivisionChurchFields: FC<{
  control: ReturnType<typeof useForm<WalkInFormValues>>['control'];
  setValue: ReturnType<typeof useForm<WalkInFormValues>>['setValue'];
  watch: ReturnType<typeof useForm<WalkInFormValues>>['watch'];
  eventOrgs: EventOrg[];
  eventId: string;
}> = ({ control, setValue, watch, eventOrgs, eventId }) => {
  const { data: churchData } = useGetEventChurches(eventId);
  const allChurches = churchData?.participating ?? [];
  const divisionOrgId = watch('divisionOrgId');

  const filteredChurches = divisionOrgId
    ? allChurches.filter((c) => c.orgId === divisionOrgId)
    : allChurches;

  useEffect(() => {
    setValue('churchId', '');
  }, [divisionOrgId, setValue]);

  if (eventOrgs.length === 0 && allChurches.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Division & Church</p>

      {eventOrgs.length > 0 && (
        <FormField
          control={control}
          name="divisionOrgId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Division <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
              >
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {eventOrgs.map((org) => (
                    <SelectItem key={org.orgId} value={org.orgId}>
                      {org.orgName}
                      {org.role === 'HOST' && (
                        <span className="text-muted-foreground ml-1">(Host)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {allChurches.length > 0 && (
        <FormField
          control={control}
          name="churchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Church <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                disabled={filteredChurches.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        filteredChurches.length === 0
                          ? 'No churches for selected division'
                          : 'Select church'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {filteredChurches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const WalkInRegistrationDialog: FC<WalkInRegistrationDialogProps> = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  feeItems,
  eventOrgs,
  paymentAccount,
}) => {
  const { mutate, isPending } = useWalkInRegistration();
  const requiredIds = feeItems.filter((i) => i.isRequired).map((i) => i.id);
  const noFeesConfigured = feeItems.length === 0;

  const form = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInFormSchema) as unknown as Resolver<WalkInFormValues>,
    defaultValues: {
      fullName:             '',
      email:                '',
      phone:                '',
      birthday:             '',
      nickname:             '',
      address:              '',
      emergencyContactName: '',
      emergencyContactPhone:'',
      divisionOrgId:        '',
      churchId:             '',
      paymentIntent:        noFeesConfigured ? 'FREE' : 'CASH',
      selectedFeeItemIds:   requiredIds,
    },
  });

  const paymentIntent = form.watch('paymentIntent');
  const selectedFeeItemIds = form.watch('selectedFeeItemIds') ?? [];
  const totalAmount = feeItems.filter((i) => selectedFeeItemIds.includes(i.id)).reduce((sum, i) => sum + i.amount, 0);
  const isFree = totalAmount === 0;

  function toggleFeeItem(itemId: string) {
    const current = form.getValues('selectedFeeItemIds') ?? [];
    const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
    form.setValue('selectedFeeItemIds', next);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    onOpenChange(open);
  };

  const onSubmit = (values: WalkInFormValues) => {
    mutate(
      {
        eventId,
        fullName:             values.fullName,
        email:                values.email,
        phone:                values.phone,
        birthday:             values.birthday,
        nickname:             values.nickname         || undefined,
        address:              values.address          || undefined,
        emergencyContactName: values.emergencyContactName  || undefined,
        emergencyContactPhone:values.emergencyContactPhone || undefined,
        churchId:             values.churchId         || undefined,
        divisionOrgId:        values.divisionOrgId    || undefined,
        paymentIntent:        isFree ? 'FREE' : values.paymentIntent,
        selectedFeeItemIds:   values.selectedFeeItemIds,
      },
      {
        onSuccess: (data) => {
          toast.success(`${data.fullName} registered`, {
            description: `Confirmation: ${data.confirmationCode}`,
          });
          form.reset();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error('Registration failed', {
            description: err.message ?? 'Unexpected error.',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Walk-in Registrant</DialogTitle>
          <DialogDescription>
            Adding to <span className="font-medium text-foreground">{eventTitle}</span>.
            Registration is auto-approved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">

            {/* ── Personal Info ── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal Info</p>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Juan dela Cruz" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nickname" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nickname <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Juan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="09xxxxxxxxx" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="birthday" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="juan@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Juban, Sorsogon" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            {/* ── Emergency Contact ── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Emergency Contact{' '}
                <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">(optional)</span>
              </p>

              <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Maria dela Cruz" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl><Input placeholder="09xxxxxxxxx" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* ── Division & Church ── */}
            <DivisionChurchFields
              control={form.control}
              setValue={form.setValue}
              watch={form.watch}
              eventOrgs={eventOrgs}
              eventId={eventId}
            />

            {(eventOrgs.length > 0) && <Separator />}

            {/* ── Fees ── */}
            {feeItems.length > 0 && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fees</p>
                  <div className="space-y-1.5">
                    {feeItems.map((item) => {
                      const selected = selectedFeeItemIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.isRequired}
                          onClick={() => toggleFeeItem(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-default',
                            selected ? 'bg-primary/10 border-primary/20' : 'border-transparent hover:bg-muted/50',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {selected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            {item.label}
                            {item.isRequired && <span className="text-xs text-muted-foreground">(Required)</span>}
                          </span>
                          <span className="font-medium">₱{item.amount.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── Payment ── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>

              {isFree ? (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  <span>This is a free event — no payment required.</span>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="paymentIntent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange('CASH')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                              field.value === 'CASH'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:bg-muted',
                            )}
                          >
                            <Banknote className="h-4 w-4" />
                            Cash On-site
                          </button>

                          {paymentAccount && (
                            <button
                              type="button"
                              onClick={() => field.onChange('ONLINE')}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                                field.value === 'ONLINE'
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border hover:bg-muted',
                              )}
                            >
                              <Smartphone className="h-4 w-4" />
                              Online
                            </button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment account details + QR code for scanning */}
                  {paymentIntent === 'ONLINE' && paymentAccount && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{paymentAccount.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {PAYMENT_METHOD_LABEL[paymentAccount.method] ?? paymentAccount.method}
                        </Badge>
                      </div>

                      <div className="space-y-0.5 text-sm">
                        <p className="font-semibold text-foreground">{paymentAccount.accountName}</p>
                        <p className="font-mono text-lg font-bold tracking-wider text-foreground">
                          {paymentAccount.accountNumber}
                        </p>
                        {paymentAccount.bankName && (
                          <p className="text-muted-foreground text-xs">{paymentAccount.bankName}</p>
                        )}
                      </div>

                      {paymentAccount.qrCodeUrl && (
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <p className="text-xs text-muted-foreground">Attendee scans to pay</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentAccount.qrCodeUrl}
                            alt="Payment QR Code"
                            className="w-52 h-52 object-contain rounded-xl border border-border bg-white p-2 shadow-sm"
                          />
                        </div>
                      )}

                      {paymentAccount.instructions && (
                        <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
                          {paymentAccount.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering…</>
                ) : (
                  'Add Registrant'
                )}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
