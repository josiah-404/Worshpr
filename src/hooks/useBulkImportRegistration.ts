import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { QUERY_KEYS } from '@/lib/constants';

export interface BulkRegistrantInput {
  fullName:              string;
  email:                 string;
  phone:                 string;
  birthday:              string;
  nickname?:             string;
  address?:              string;
  churchId?:             string;
  divisionOrgId?:        string;
  emergencyContactName?: string;
  emergencyContactPhone?:string;
  status:                'APPROVED' | 'PENDING';
  overwrite:             boolean;
}

export interface BulkRowResult {
  rowIndex:          number;
  fullName:          string;
  email:             string;
  outcome:           'success' | 'duplicate' | 'failed';
  confirmationCode?: string;
  error?:            string;
}

export interface BulkImportResult {
  imported: number;
  skipped:  number;
  failed:   number;
  results:  BulkRowResult[];
}

async function bulkImport(payload: {
  eventId:     string;
  registrants: BulkRegistrantInput[];
}): Promise<BulkImportResult> {
  const { data } = await api.post('/registrations/admin/bulk', payload);
  return data.data;
}

export const useBulkImportRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkImportResult, Error, { eventId: string; registrants: BulkRegistrantInput[] }>({
    mutationFn: bulkImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGISTRATIONS] });
    },
  });
};
