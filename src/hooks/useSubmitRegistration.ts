'use client';

import { useMutation } from '@tanstack/react-query';
import { submitRegistration } from '@/services/registration.service';
import type { RegistrationGroupPayload, RegistrationGroupResult } from '@/types';

export function useSubmitRegistration() {
  return useMutation<RegistrationGroupResult, Error, RegistrationGroupPayload>({
    mutationFn: submitRegistration,
  });
}
