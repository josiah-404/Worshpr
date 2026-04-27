'use client';

import { type FC } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { RegistrationGroupResult } from '@/types';

interface RegistrationSuccessViewProps {
  result: RegistrationGroupResult;
  eventTitle: string;
}

export const RegistrationSuccessView: FC<RegistrationSuccessViewProps> = ({ result, eventTitle }) => {
  function copyCode() {
    navigator.clipboard.writeText(result.confirmationCode);
    toast.success('Copied!', { description: 'Confirmation code copied to clipboard.' });
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Registration Submitted!</h2>
        <p className="text-muted-foreground text-sm">
          You have successfully registered for{' '}
          <span className="font-medium text-foreground">{eventTitle}</span>.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          Confirmation Code
        </p>
        <div className="flex items-center gap-2 justify-center">
          <span className="font-mono text-xl font-bold tracking-widest">
            {result.confirmationCode}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Save this code — you&apos;ll need it to check your registration status.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          Registered ({result.headcount})
        </p>
        <div className="space-y-1">
          {result.registrations.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 text-sm border rounded-md px-3 py-2">
              <span className="font-medium">{r.fullName}</span>
              <span className="text-muted-foreground text-xs sm:text-sm truncate">{r.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
