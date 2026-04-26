'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForgotPassword } from '@/hooks/use-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutateAsync, isPending, error } = useForgotPassword();

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : ((error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Something went wrong')
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({ email });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='w-full max-w-sm space-y-6'>
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
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                If <strong>{email}</strong> is registered, a password reset link
                has been sent. It expires in 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/login'>
                <Button variant='outline' className='w-full'>
                  Back to sign in
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-sm space-y-6'>
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
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <Input
                type='email'
                required
                placeholder='you@church.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errorMessage && (
                <p className='text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2'>
                  {errorMessage}
                </p>
              )}
              <Button type='submit' className='w-full' disabled={isPending}>
                {isPending ? 'Sending...' : 'Send reset link'}
              </Button>
              <Link href='/login'>
                <Button variant='ghost' className='w-full'>
                  Back to sign in
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
