import { useQuery } from '@tanstack/react-query';
import { getBibleBooks } from '@/services/bible.service';

export const useBibleBooks = (bibleId: string | undefined) =>
  useQuery({
    queryKey: ['bible', 'books', bibleId],
    queryFn: () => getBibleBooks(bibleId as string),
    enabled: !!bibleId,
    staleTime: Infinity,
    gcTime: Infinity,
  });
