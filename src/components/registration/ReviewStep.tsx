'use client';

import { type FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RegistrationGroupInput } from '@/validations/registration.schema';
import type { PublicEventData } from '@/types';

interface ReviewStepProps {
  event: PublicEventData;
}

export const ReviewStep: FC<ReviewStepProps> = ({ event }) => {
  const form = useFormContext<RegistrationGroupInput>();
  const values = form.getValues();

  const totalFee = event.fee * values.registrants.length;

  return (
    <div className="space-y-6 text-sm">
      {/* Event */}
      <div>
        <p className="font-semibold text-xs uppercase text-muted-foreground tracking-wide mb-2">Event</p>
        <p className="font-medium">{event.title}</p>
        {event.venue && <p className="text-muted-foreground">{event.venue}</p>}
      </div>

      <Separator />

      {/* Submitted by */}
      <div>
        <p className="font-semibold text-xs uppercase text-muted-foreground tracking-wide mb-2">Submitted By</p>
        <p>{values.submittedByName}</p>
        <p className="text-muted-foreground">{values.submittedByEmail}</p>
      </div>

      <Separator />

      {/* Registrants */}
      <div>
        <p className="font-semibold text-xs uppercase text-muted-foreground tracking-wide mb-2">
          Registrants ({values.registrants.length})
        </p>
        <div className="space-y-3">
          {values.registrants.map((r, i) => (
            <div key={i} className="rounded-md border p-3 space-y-1">
              <p className="font-medium">
                {r.fullName}{r.nickname ? ` (${r.nickname})` : ''}
              </p>
              <p className="text-muted-foreground">{r.email} · {r.phone}</p>
              {(r.churchId || r.divisionOrgId) && (
                <p className="text-muted-foreground text-xs">
                  {[
                    r.churchId ? (event.churches.find((c) => c.id === r.churchId)?.name ?? r.churchId) : null,
                    r.divisionOrgId ? (event.organizations.find((o) => o.orgId === r.divisionOrgId)?.orgName ?? r.divisionOrgId) : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="text-muted-foreground text-xs">{r.address}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Payment */}
      <div>
        <p className="font-semibold text-xs uppercase text-muted-foreground tracking-wide mb-2">Payment</p>
        {event.fee === 0 ? (
          <Badge variant="secondary">Free</Badge>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">₱{totalFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <Badge variant="outline">
                {values.paymentIntent === 'ONLINE' ? `Online · ${values.payment?.method ?? ''}` : 'Cash On-site'}
              </Badge>
            </div>
            {values.payment?.referenceNo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference #</span>
                <span>{values.payment.referenceNo}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
