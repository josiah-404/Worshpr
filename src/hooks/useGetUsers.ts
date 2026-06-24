'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/user.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { GetUsersParams, PaginatedUsersResponse } from '@/types';

export function useGetUsers(params: GetUsersParams) {
  return useQuery<PaginatedUsersResponse>({
    queryKey: [QUERY_KEYS.USERS, params],
    queryFn: () => getUsers(params),
    staleTime: 30_000,
  });
}
