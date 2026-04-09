'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateRegistrationStatus,
  type UpdateRegistrationStatusPayload,
} from '@/services/registration.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useUpdateRegistrationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRegistrationStatusPayload }) =>
      updateRegistrationStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGISTRATIONS] });
    },
  });
}
