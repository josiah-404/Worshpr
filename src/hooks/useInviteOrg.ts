'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteOrg } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { InviteOrgInput } from '@/validations/event.schema';

export function useInviteOrg(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, InviteOrgInput>({
    mutationFn: (input) => inviteOrg(eventId, input),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EVENTS], type: 'active' });
    },
  });
}
