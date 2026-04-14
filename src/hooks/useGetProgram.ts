import { useQuery } from '@tanstack/react-query';
import { getProgram } from '@/services/program.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { EventProgramData } from '@/types';

export const useGetProgram = (
  eventId: string,
  initialData?: EventProgramData | null,
) => {
  return useQuery<EventProgramData | null>({
    queryKey: [QUERY_KEYS.PROGRAM, eventId],
    queryFn: () => getProgram(eventId),
    enabled: !!eventId,
    initialData: initialData ?? undefined,
  });
};
