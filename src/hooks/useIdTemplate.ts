import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getIdTemplate, saveIdTemplate } from '@/services/id.service';
import type { IdTemplateInput } from '@/validations/id.schema';

const KEY = (eventId: string) => ['id-template', eventId];

export function useIdTemplate(eventId: string) {
  return useQuery({
    queryKey: KEY(eventId),
    queryFn: () => getIdTemplate(eventId),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}

export function useSaveIdTemplate(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IdTemplateInput) => saveIdTemplate(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(eventId) });
      toast.success('Template saved');
    },
    onError: () => toast.error('Failed to save template'),
  });
}
