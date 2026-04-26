'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useLogin';
import { loginSchema, type LoginInput } from '@/validations/auth.schema';

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-sm space-y-6'>
        {/* Logo */}
        <div className='text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>
            <span className='text-primary tracking-wide'>EMBR</span>
          </h1>
          <p className='text-muted-foreground mt-2 text-sm'>
            Worship Media Team Portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => login(data))}>
              <FieldGroup>
                <Controller
                  name='email'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='login-email'>Email</FieldLabel>
                      <Input
                        {...field}
                        id='login-email'
                        type='email'
                        placeholder='you@church.com'
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name='password'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='login-password'>Password</FieldLabel>
                      <div className='relative'>
                        <Input
                          {...field}
                          id='login-password'
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          aria-invalid={fieldState.invalid}
                          className='pr-10'
                        />
                        <button
                          type='button'
                          tabIndex={-1}
                          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className='flex justify-end mt-2'>
                <Link
                  href='/auth/forgot-password'
                  className='text-sm text-muted-foreground hover:text-foreground underline'
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type='submit'
                className='w-full mt-4'
                disabled={isPending}
              >
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
