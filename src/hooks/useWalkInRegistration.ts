import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaymentIntent } from '@/types';

export interface WalkInRegistrationInput {
  eventId:              string;
  fullName:             string;
  email:                string;
  phone:                string;
  birthday:             string;
  nickname?:            string;
  address?:             string;
  emergencyContactName?: string;
  emergencyContactPhone?:string;
  churchId?:            string;
  divisionOrgId?:       string;
  paymentIntent:        PaymentIntent;
  selectedFeeItemIds?:  string[];
  answers?:             Record<string, string>;
}

interface WalkInRegistrationResult {
  confirmationCode: string;
  fullName: string;
  email: string;
}

async function submitWalkIn(input: WalkInRegistrationInput): Promise<WalkInRegistrationResult> {
  const { data } = await api.post('/registrations/admin', input);
  return data.data;
}

export const useWalkInRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation<WalkInRegistrationResult, Error, WalkInRegistrationInput>({
    mutationFn: submitWalkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGISTRATIONS] });
    },
  });
};
