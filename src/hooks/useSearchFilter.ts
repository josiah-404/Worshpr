import { type ColumnFiltersState } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useSearchFilter(filterKey: string) {
  const searchParams = useSearchParams();

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const query = searchParams.get('query');
    return query ? [{ id: filterKey, value: query }] : [];
  }, [searchParams, filterKey]);

  return { columnFilters };
}
