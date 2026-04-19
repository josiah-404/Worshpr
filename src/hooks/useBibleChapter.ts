import { useQuery } from '@tanstack/react-query';
import { getBibleChapter } from '@/services/bible.service';

export const useBibleChapter = (chapterId: string | undefined) =>
  useQuery({
    queryKey: ['bible', 'chapter', chapterId],
    queryFn: () => getBibleChapter(chapterId as string),
    enabled: !!chapterId,
    staleTime: 60 * 60 * 1000,
  });
