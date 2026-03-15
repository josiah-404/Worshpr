'use client';

import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface FilterOption {
  label: string;
  value: string;
}

export interface ColumnFilterConfig {
  /** Must match a column id defined in your ColumnDef array */
  columnId: string;
  placeholder: string;
  options: FilterOption[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Enables global text search across all string-valued cells */
  searchPlaceholder?: string;
  /** Per-column dropdown filters */
  filters?: ColumnFilterConfig[];
  /** Slot for action buttons (e.g. "Add" button) rendered on the right of the toolbar */
  toolbarRight?: ReactNode;
  /** Shown when the table has no rows after filtering */
  emptyState?: ReactNode;
  /** Shown when data is empty before any filtering (overrides emptyState) */
  emptyMessage?: string;
}

const ALL_VALUE = '__ALL__';

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Search…',
  filters = [],
  toolbarRight,
  emptyState,
  emptyMessage,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnFilters, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
  });

  function clearAllFilters() {
    setGlobalFilter('');
    setColumnFilters([]);
  }

  const hasActiveFilters = globalFilter !== '' || columnFilters.length > 0;
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Global search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 pl-8 pr-8 text-sm"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Per-column dropdown filters */}
          {filters.map((f) => {
            const currentValue =
              (table.getColumn(f.columnId)?.getFilterValue() as string | undefined) ?? '';

            return (
              <Select
                key={f.columnId}
                value={currentValue === '' ? ALL_VALUE : currentValue}
                onValueChange={(val) => {
                  table
                    .getColumn(f.columnId)
                    ?.setFilterValue(val === ALL_VALUE ? undefined : val);
                }}
              >
                <SelectTrigger className="h-9 w-[160px] text-sm">
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{f.placeholder}</SelectItem>
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 px-2 text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Right slot */}
        {toolbarRight && <div className="shrink-0">{toolbarRight}</div>}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={canSort ? 'cursor-pointer select-none' : ''}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="ml-1">
                              {sorted === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : sorted === 'desc' ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  {emptyState ?? (
                    <span className="text-muted-foreground text-sm">
                      {emptyMessage ?? 'No results found.'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
