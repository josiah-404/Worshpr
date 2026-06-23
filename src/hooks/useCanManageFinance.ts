'use client';

import { useSession } from 'next-auth/react';
import { canManageFinance } from '@/lib/org-access';

export function useCanManageFinance(): boolean {
  const { data: session } = useSession();
  return canManageFinance(session);
}
