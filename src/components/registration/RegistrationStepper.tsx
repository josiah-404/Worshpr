'use client';

import { type FC, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegistrantInfoStep } from '@/components/registration/RegistrantInfoStep';
import { PaymentStep } from '@/components/registration/PaymentStep';
import { ReviewStep } from '@/components/registration/ReviewStep';
import { RegistrationSuccessView } from '@/components/registration/RegistrationSuccessView';
import { useSubmitRegistration } from '@/hooks/useSubmitRegistration';
import { registrationGroupSchema, type RegistrationGroupInput } from '@/validations/registration.schema';
import type { PublicEventData, RegistrationGroupResult } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type RegistrationType = 'individual' | 'group';

interface RegistrationStepperProps {
  event: PublicEventData;
}

const STEPS = ['Your Info', 'Payment', 'Review'];

export const RegistrationStepper: FC<RegistrationStepperProps> = ({ event }) => {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<RegistrationGroupResult | null>(null);
  // Group registration temporarily disabled — selector hidden, defaults to individual
  const [registrationType] = useState<RegistrationType>('individual');

  const tc = event.themeColor ?? null;

  const isFree = event.fee === 0;

  const form = useForm<RegistrationGroupInput>({
    resolver: zodResolver(registrationGroupSchema),
    defaultValues: {
      eventId: event.id,
      submittedByName: '',
      submittedByEmail: '',
      registrants: [
        {
          fullName: '',
          nickname: '',
          email: '',
          phone: '',
          birthday: '',
          address: '',
          photoUrl: '',
          churchId: '',
          divisionOrgId: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
        },
      ],
      paymentIntent: isFree ? 'FREE' : 'CASH',
      payment: undefined,
    },
  });

  const { mutate, isPending } = useSubmitRegistration();

  async function handleNext() {
    let valid = false;
    if (step === 0) {
      valid = await form.trigger(['registrants']);
    } else if (step === 1) {
      const paymentIntent = form.getValues('paymentIntent');
      const fieldsToValidate: (keyof RegistrationGroupInput)[] =
        paymentIntent === 'ONLINE' ? ['paymentIntent', 'payment'] : ['paymentIntent'];
      valid = await form.trigger(fieldsToValidate);
    } else {
      valid = true;
    }
    if (!valid) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  function handleSubmit() {
    const data = form.getValues();

    // Auto-fill submitter from the first registrant
    const submittedByName = data.registrants[0]?.fullName ?? '';
    const submittedByEmail = data.registrants[0]?.email ?? '';

    // Strip payment when not paying online, or for free events
    const paymentIntent = isFree ? ('FREE' as const) : data.paymentIntent;
    const payment = paymentIntent === 'ONLINE' ? data.payment : undefined;

    mutate(
      { ...data, submittedByName, submittedByEmail, paymentIntent, payment },
      {
        onSuccess: (res) => setResult(res),
        onError: (err) => {
          toast.error('Registration failed', {
            description: err.message ?? 'An unexpected error occurred.',
          });
        },
      },
    );
  }

  if (result) {
    return <RegistrationSuccessView result={result} eventTitle={event.title} />;
  }

  return (
    <div className="space-y-6">
      {/* Registration type selector — temporarily hidden */}

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                i > step
                  ? 'bg-muted text-muted-foreground'
                  : tc ? '' : i === step
                    ? 'bg-primary text-primary-foreground ring-[3px] ring-primary/20'
                    : 'bg-primary text-primary-foreground',
              )}
              style={i <= step && tc ? {
                backgroundColor: tc,
                color: 'white',
                boxShadow: i === step ? `0 0 0 3px ${tc}33` : undefined,
              } : undefined}
            >
              {i < step ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : i + 1}
            </div>
            {/* Label: hidden on xs, visible on sm+ */}
            <span
              className={cn(
                'hidden sm:inline text-sm transition-colors truncate',
                i === step ? 'font-semibold' : 'text-muted-foreground',
                i === step && !tc ? 'text-primary' : '',
              )}
              style={i === step && tc ? { color: tc } : undefined}
            >
              {label}
            </span>
            {/* Current step label on mobile only */}
            {i === step && (
              <span
                className={cn('sm:hidden text-xs font-semibold truncate', !tc ? 'text-primary' : '')}
                style={tc ? { color: tc } : undefined}
              >
                {label}
              </span>
            )}
            {i < STEPS.length - 1 && (
              <div
                className={cn('h-px w-6 sm:w-8 shrink-0 transition-colors duration-500', i < step && !tc ? 'bg-primary' : 'bg-border')}
                style={i < step && tc ? { backgroundColor: tc } : undefined}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <FormProvider {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {step === 0 && <RegistrantInfoStep registrationType={registrationType} eventOrgs={event.organizations} churches={event.churches} />}
          {step === 1 && <PaymentStep event={event} />}
          {step === 2 && <ReviewStep event={event} />}

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-1 w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-1 w-full sm:w-auto"
                style={tc ? { backgroundColor: tc, borderColor: tc } : undefined}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending}
                className="gap-2 w-full sm:w-auto"
                onClick={handleSubmit}
                style={tc ? { backgroundColor: tc, borderColor: tc } : undefined}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Registration
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
