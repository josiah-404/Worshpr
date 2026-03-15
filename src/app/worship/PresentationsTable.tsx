'use client';

import { useMemo, type FC } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Monitor, Play } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { BACKGROUNDS, BG_BADGE_COLORS, FONT_LABELS, FONTS } from '@/lib/constants';
import { DataTable } from '@/components/common/DataTable';
import { usePresentations } from '@/hooks/usePresentations';
import type { Presentation } from '@/types';

interface PresentationsTableProps {
  presentations: Presentation[];
}

const BG_LABELS = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b.label]));

function slideCount(lyrics: string): number {
  return lyrics
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean).length;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const PresentationsTable: FC<PresentationsTableProps> = ({ presentations: initial }) => {
  const router = useRouter();
  const { presentations, deleting, deletePresentation } = usePresentations(initial);

  const columns: ColumnDef<Presentation>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'bgId',
        header: 'Background',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              BG_BADGE_COLORS[row.original.bgId] ?? 'bg-muted text-muted-foreground'
            }`}
          >
            {BG_LABELS[row.original.bgId] ?? row.original.bgId}
          </span>
        ),
        filterFn: 'equalsString',
        enableSorting: false,
      },
      {
        accessorKey: 'fontId',
        header: 'Font',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {FONT_LABELS[row.original.fontId] ?? row.original.fontId}
          </span>
        ),
        filterFn: 'equalsString',
        enableSorting: true,
      },
      {
        id: 'slides',
        accessorFn: (row) => slideCount(row.lyrics),
        header: 'Slides',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{slideCount(row.original.lyrics)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{timeAgo(row.original.updatedAt)}</span>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => router.push(`/worship/editor?id=${row.original.id}&present=1`)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Present"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => router.push(`/worship/editor?id=${row.original.id}`)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deletePresentation(row.original.id)}
              disabled={deleting === row.original.id}
              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [router, deleting, deletePresentation],
  );

  const bgFilterOptions = useMemo(
    () => BACKGROUNDS.map((b) => ({ label: b.label, value: b.id })),
    [],
  );

  const fontFilterOptions = useMemo(
    () => FONTS.map((f) => ({ label: f.label, value: f.id })),
    [],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <Monitor className="h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">No presentations yet</p>
      <p className="text-xs text-muted-foreground/60">
        Create your first presentation to get started
      </p>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={presentations}
      searchPlaceholder="Search presentations…"
      filters={[
        {
          columnId: 'bgId',
          placeholder: 'All Backgrounds',
          options: bgFilterOptions,
        },
        {
          columnId: 'fontId',
          placeholder: 'All Fonts',
          options: fontFilterOptions,
        },
      ]}
      emptyState={emptyState}
    />
  );
};
