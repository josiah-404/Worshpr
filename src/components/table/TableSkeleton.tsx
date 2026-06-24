import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type ColumnDef } from '@tanstack/react-table';

interface TableSkeletonProps {
  columns: ColumnDef<unknown, unknown>[];
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow
          key={rowIndex}
          className={cn('bg-transparent', rowIndex % 2 !== 0 && 'bg-muted/50')}
        >
          {columns.map((_, colIndex) => (
            <TableCell key={colIndex} className="px-3 py-2 sm:px-6 sm:py-2.5">
              <Skeleton className="h-4 w-full max-w-[12rem]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
