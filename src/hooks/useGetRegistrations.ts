'use client';

import { useQuery } from '@tanstack/react-query';
import { getRegistrations, type GetRegistrationsParams } from '@/services/registration.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { RegistrationListItem } from '@/types';

export function useGetRegistrations(
  params: GetRegistrationsParams,
  initialData?: RegistrationListItem[],
) {
  return useQuery<RegistrationListItem[]>({
    queryKey: [QUERY_KEYS.REGISTRATIONS, params],
    queryFn: () => getRegistrations(params),
    initialData,
    staleTime: 30_000,
  });
}
