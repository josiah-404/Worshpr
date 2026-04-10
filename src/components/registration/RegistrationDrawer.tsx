'use client';

import { type FC, useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, Ban, Loader2, ExternalLink,
  Phone, Mail, MapPin, Calendar, AlertTriangle, Tag, Church, Building2,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateRegistrationStatus } from '@/hooks/useUpdateRegistrationStatus';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RegistrationListItem, RegistrationStatus } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  PENDING:   { label: 'Pending',   variant: 'outline',     className: 'border-amber-500/50 text-amber-500' },
  APPROVED:  { label: 'Approved',  variant: 'default',     className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  REJECTED:  { label: 'Rejected',  variant: 'destructive', className: '' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary',   className: '' },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash', GCASH: 'GCash', MAYA: 'Maya',
  BANK_TRANSFER: 'Bank Transfer', OTHER: 'Other',
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return format(new Date(iso), 'MMM d, yyyy h:mm a');
}

// ─── Component ─────────────────────────────────────────────────────────────

interface RegistrationDrawerProps {
  registration: RegistrationListItem | null;
  onClose: () => void;
}

export const RegistrationDrawer: FC<RegistrationDrawerProps> = ({ registration, onClose }) => {
  const [notes, setNotes] = useState('');
  const { mutate, isPending } = useUpdateRegistrationStatus();

  function handleAction(status: 'APPROVED' | 'REJECTED' | 'CANCELLED') {
    if (!registration) return;
    mutate(
      { id: registration.id, payload: { status, notes: notes || undefined } },
      {
        onSuccess: () => {
          toast.success(
            status === 'APPROVED' ? 'Registration approved' :
            status === 'REJECTED' ? 'Registration rejected' : 'Registration cancelled',
          );
          setNotes('');
          onClose();
        },
        onError: () => toast.error('Failed to update registration'),
      },
    );
  }

  const reg = registration;
  const statusConfig = reg ? STATUS_CONFIG[reg.status] : null;

  return (
    <Sheet open={!!reg} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {reg && statusConfig && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-lg">{reg.registrant.fullName}</SheetTitle>
                <Badge
                  variant={statusConfig.variant}
                  className={cn('text-xs', statusConfig.className)}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <SheetDescription>
                Confirmation: <span className="font-mono font-semibold">{reg.group.confirmationCode}</span>
                {' · '}Group of {reg.group.headcount}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {/* Registrant Info */}
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registrant</p>
                <div className="space-y-1.5 text-sm">
                  {reg.registrant.nickname && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span>{reg.registrant.nickname}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>{reg.registrant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{reg.registrant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{format(new Date(reg.registrant.birthday), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{reg.registrant.address}</span>
                  </div>
                  {reg.registrant.churchName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Church className="h-3.5 w-3.5 shrink-0" />
                      <span>{reg.registrant.churchName}</span>
                    </div>
                  )}
                  {reg.registrant.divisionOrgName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{reg.registrant.divisionOrgName}</span>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Emergency Contact */}
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency Contact</p>
                <div className="space-y-1.5 text-sm">
                  <p>{reg.registrant.emergencyContactName}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{reg.registrant.emergencyContactPhone}</span>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Payment */}
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intent</span>
                    <Badge variant="outline" className="text-xs">
                      {reg.paymentIntent === 'FREE' ? 'Free' :
                       reg.paymentIntent === 'CASH' ? 'Cash On-site' : 'Online'}
                    </Badge>
                  </div>
                  {reg.payment && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold">₱{reg.payment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method</span>
                        <span>{PAYMENT_METHOD_LABEL[reg.payment.method] ?? reg.payment.method}</span>
                      </div>
                      {reg.payment.referenceNo && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference #</span>
                          <span className="font-mono">{reg.payment.referenceNo}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={reg.payment.status === 'VERIFIED' ? 'default' : reg.payment.status === 'REJECTED' ? 'destructive' : 'outline'}
                          className={cn('text-xs', reg.payment.status === 'VERIFIED' && 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30')}
                        >
                          {reg.payment.status}
                        </Badge>
                      </div>
                      {reg.payment.receiptUrl && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs text-muted-foreground">Proof of Payment</p>
                          <a
                            href={reg.payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-md border border-border hover:opacity-90 transition-opacity"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={reg.payment.receiptUrl}
                              alt="Payment receipt"
                              className="w-full object-contain max-h-64 bg-muted"
                            />
                            <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-primary border-t border-border">
                              <ExternalLink className="h-3 w-3" />
                              Open full image
                            </div>
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              <Separator />

              {/* Timeline */}
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Submitted</span>
                    <span>{formatDate(reg.createdAt)}</span>
                  </div>
                  {reg.approvedAt && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Approved</span>
                      <span>{formatDate(reg.approvedAt)}</span>
                    </div>
                  )}
                  {reg.rejectedAt && (
                    <div className="flex justify-between text-destructive">
                      <span>Rejected</span>
                      <span>{formatDate(reg.rejectedAt)}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Notes (existing) */}
              {reg.notes && (
                <>
                  <Separator />
                  <section className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="text-sm text-muted-foreground">{reg.notes}</p>
                  </section>
                </>
              )}

              {/* Action area — only show if not already in a final state */}
              {reg.status === 'PENDING' && (
                <>
                  <Separator />
                  <section className="space-y-3">
                    <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Add a note for this action..."
                      className="resize-none"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAction('APPROVED')}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-1.5"
                        onClick={() => handleAction('REJECTED')}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Reject
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full gap-1.5 text-muted-foreground"
                      onClick={() => handleAction('CANCELLED')}
                      disabled={isPending}
                    >
                      <Ban className="h-4 w-4" />
                      Cancel Registration
                    </Button>
                  </section>
                </>
              )}

              {reg.status === 'APPROVED' && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>This registration has been approved.</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => handleAction('CANCELLED')}
                    disabled={isPending}
                  >
                    <Ban className="h-4 w-4" />
                    Cancel Registration
                  </Button>
                </>
              )}

              {reg.status === 'REJECTED' && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>This registration was rejected.</span>
                  </div>
                  <Button
                    className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAction('APPROVED')}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Instead
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
