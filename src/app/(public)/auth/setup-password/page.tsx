'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSetupPassword } from '@/hooks/use-auth';
import {
  setupPasswordClientSchema,
  type SetupPasswordClientInput,
} from '@/validations/user.schema';

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutateAsync, isPending } = useSetupPassword();

  const form = useForm<SetupPasswordClientInput>({
    resolver: zodResolver(setupPasswordClientSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: SetupPasswordClientInput) {
    try {
      await mutateAsync({ token, password: values.password });
      toast.success('Password set!', { description: 'You can now sign in.' });
      router.push('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Something went wrong';
      toast.error('Setup failed', { description: message });
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Invalid setup link.{' '}
        <a href="/login" className="underline">
          Return to sign in.
        </a>
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                disabled={isPending}
                aria-invalid={fieldState.invalid}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
      <Controller
        name="confirmPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <div className="relative">
              <Input
                {...field}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                disabled={isPending}
                aria-invalid={fieldState.invalid}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Must be at least 8 characters with uppercase, lowercase, number, and special character.
      </p>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Setting password...' : 'Set Password'}
      </Button>
    </form>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-primary tracking-wide">EMBR</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Worship Media Team Portal</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set up your password</CardTitle>
            <CardDescription>Create a password to activate your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
              <SetupPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
