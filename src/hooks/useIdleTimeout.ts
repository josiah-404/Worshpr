'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

const IDLE_MS = 30 * 60 * 1000;        // 30 minutes idle → sign out
const WARN_BEFORE_MS = 2 * 60 * 1000;  // warn 2 minutes before sign-out

const EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
] as const;

export function useIdleTimeout() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let warningId: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);

      warningId = setTimeout(() => {
        toast.warning('Session expiring soon', {
          description: 'You will be signed out in 2 minutes due to inactivity.',
          duration: WARN_BEFORE_MS,
        });
      }, IDLE_MS - WARN_BEFORE_MS);

      timeoutId = setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, IDLE_MS);
    };

    EVENTS.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timeoutId);
      clearTimeout(warningId);
    };
  }, []);
}
