import { TableCell, TableRow } from '@/components/ui/table';
import { type ColumnDef } from '@tanstack/react-table';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  columns: ColumnDef<unknown, unknown>[];
}

export function EmptyState({ message, columns }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-64">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileX className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium">No data found</h3>
            <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
