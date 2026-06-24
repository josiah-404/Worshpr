'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  type ColumnDef,
  type Row,
  type Table as TableType,
} from '@tanstack/react-table';
import { FileX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from './DataTable';
import { useIsLgUp } from '@/hooks/useMediaQuery';

function MobileEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border bg-card px-4 py-10 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <FileX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium">No data found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function MobileListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[66%] max-w-[12rem]" />
            <Skeleton className="h-3 w-[40%] max-w-[6rem]" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export interface ResponsiveTableLayoutProps<TData, TValue> {
  table: TableType<TData>;
  columns: ColumnDef<TData, TValue>[];
  isLoading: boolean;
  loadingRows?: number;
  noRecordMessage?: string;
  renderMobileRow: (row: Row<TData>) => ReactNode;
  className?: string;
}

export function ResponsiveTableLayout<TData, TValue>({
  table,
  columns,
  isLoading,
  loadingRows = 8,
  noRecordMessage = 'No records found.',
  renderMobileRow,
  className,
}: ResponsiveTableLayoutProps<TData, TValue>) {
  const isLgUp = useIsLgUp();

  if (isLgUp) {
    return (
      <div className={className}>
        <DataTable
          columns={columns}
          table={table}
          isLoading={isLoading}
          loadingRows={loadingRows}
          noRecordMessage={noRecordMessage}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <MobileListSkeleton rows={loadingRows} />
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  if (!rows.length) {
    return (
      <div className={className}>
        <MobileEmptyState message={noRecordMessage} />
      </div>
    );
  }

  return (
    <div className={cn('divide-y overflow-hidden rounded-xl border bg-card', className)}>
      {rows.map((row) => (
        <div key={row.id} className="min-h-[3.25rem]">
          {renderMobileRow(row)}
        </div>
      ))}
    </div>
  );
}
