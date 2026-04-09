'use client';

import { type FC, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Loader2, User, Users } from 'lucide-react';
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
  const [registrationType, setRegistrationType] = useState<RegistrationType>('individual');

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
          church: '',
          organization: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
        },
      ],
      paymentIntent: isFree ? 'FREE' : 'CASH',
      payment: undefined,
    },
  });

  const { mutate, isPending } = useSubmitRegistration();

  function handleRegistrationTypeChange(type: RegistrationType) {
    setRegistrationType(type);
    if (type === 'individual') {
      const first = form.getValues('registrants')[0];
      form.setValue('registrants', [first]);
    }
  }

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
      {/* Registration type selector — only visible on step 0 */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-3">
          {(['individual', 'group'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleRegistrationTypeChange(type)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors',
                registrationType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {type === 'individual' ? (
                <User className="h-6 w-6" />
              ) : (
                <Users className="h-6 w-6" />
              )}
              {type === 'individual' ? 'Individual' : 'Group'}
              <span className="text-xs font-normal text-muted-foreground">
                {type === 'individual' ? 'Register yourself only' : 'Register multiple people'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${
                i === step ? 'font-semibold' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <FormProvider {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {step === 0 && <RegistrantInfoStep registrationType={registrationType} eventOrgs={event.organizations} />}
          {step === 1 && <PaymentStep event={event} />}
          {step === 2 && <ReviewStep event={event} />}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={isPending} className="gap-2" onClick={handleSubmit}>
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
