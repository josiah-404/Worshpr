import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  type ColumnDef,
  type Table as TableType,
  flexRender,
} from '@tanstack/react-table';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './TableSkeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: TableType<TData>;
  noRecordMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
}

export function DataTable<TData, TValue>({
  columns,
  table,
  noRecordMessage = 'No records found. Please try a different search.',
  isLoading = false,
  loadingRows = 5,
}: DataTableProps<TData, TValue>) {
  const hasData = table.getRowModel().rows?.length > 0;
  const showEmptyState = !isLoading && !hasData;

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground sm:px-6 sm:text-nowrap',
                    (header.column.columnDef.meta as { className?: string })?.className,
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton columns={columns as ColumnDef<unknown, unknown>[]} rows={loadingRows} />
          ) : showEmptyState ? (
            <EmptyState message={noRecordMessage} columns={columns as ColumnDef<unknown, unknown>[]} />
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn('bg-transparent', idx % 2 !== 0 && 'bg-muted/50')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'px-3 py-2 align-middle sm:px-6 sm:py-2.5',
                      (cell.column.columnDef.meta as { className?: string })?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
