import { useQuery } from '@tanstack/react-query';
import { getEventQuestions } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventQuestion } from '@/types';

export function useGetEventQuestions(eventId: string | null | undefined) {
  return useQuery<EventQuestion[]>({
    queryKey: [QUERY_KEYS.EVENT_QUESTIONS, eventId],
    queryFn: () => getEventQuestions(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
