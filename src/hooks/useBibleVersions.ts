import { useQuery } from '@tanstack/react-query';
import { getBibleVersions } from '@/services/bible.service';

export const useBibleVersions = () =>
  useQuery({
    queryKey: ['bible', 'versions'],
    queryFn: getBibleVersions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
