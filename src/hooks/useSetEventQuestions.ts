import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setEventQuestions } from '@/services/event.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventQuestion, EventQuestionInput } from '@/types';

export function useSetEventQuestions(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<EventQuestion[], Error, EventQuestionInput[]>({
    mutationFn: (items) => setEventQuestions(eventId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_QUESTIONS, eventId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}
