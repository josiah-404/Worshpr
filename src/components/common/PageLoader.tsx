import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageLoaderProps {
  /** 'table'  — header + data table rows (management pages)
   *  'cards'  — header + card grid (events, IDs, etc.)
   *  'detail' — header + form fields (single-item detail pages)
   */
  variant?: 'table' | 'cards' | 'detail';
  /** Number of skeleton rows (table) or cards (cards). Defaults: table=6, cards=8 */
  count?: number;
  /** Show an action button skeleton in the top-right. Default true. */
  hasAction?: boolean;
}

// ─── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header row */}
      <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
        {[120, 160, 100, 80].map((w, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 px-4 py-3.5 border-b border-border last:border-0"
        >
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
          <div className="ml-auto flex gap-1.5">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cards skeleton ────────────────────────────────────────────────────────────

function CardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden flex flex-col">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
          <div className="px-4 pb-4 flex items-center justify-between border-t border-border/40 pt-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Detail skeleton ───────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Skeleton className="h-40 w-full rounded-lg" />
      {[200, 240, 160, 180].map((w, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PageLoader({
  variant = 'table',
  count,
  hasAction = true,
}: PageLoaderProps) {
  const defaultCount = variant === 'cards' ? 8 : 6;
  const rows = count ?? defaultCount;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-4 w-56 rounded" />
        </div>
        {hasAction && <Skeleton className="h-9 w-28 rounded-md" />}
      </div>

      {/* Content */}
      {variant === 'table'  && <TableSkeleton rows={rows} />}
      {variant === 'cards'  && <CardsSkeleton count={rows} />}
      {variant === 'detail' && <DetailSkeleton />}
    </div>
  );
}
