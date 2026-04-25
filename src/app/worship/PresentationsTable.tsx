'use client';

import { type FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Monitor, Play, Radio } from 'lucide-react';
import { BACKGROUNDS, BG_BADGE_COLORS, FONT_LABELS } from '@/lib/constants';
import { TourTrigger } from '@/components/guides/TourTrigger';
import { usePresentations } from '@/hooks/usePresentations';
import { useConfirm } from '@/hooks/useConfirm';
import { useIsPresentationActive } from '@/hooks/useIsPresentationActive';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
  const isLive = useIsPresentationActive();
  const [livePresentationId, setLivePresentationId] = useState<string | null>(null);

  useEffect(() => {
    if (isLive) {
      setLivePresentationId(sessionStorage.getItem('worship-live-pres'));
    }
  }, [isLive]);

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Presentation',
    description: 'This will permanently delete the presentation and cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  async function handleDelete(id: string) {
    const ok = await confirm();
    if (!ok) return;
    await deletePresentation(id);
  }

  if (presentations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg">
        <Monitor className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No presentations yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create your first presentation to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {isLive && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
            <Radio className="h-4 w-4 animate-pulse" />
            A presentation is currently live
          </div>
          {livePresentationId && (
            <button
              onClick={() => router.push(`/worship/editor?id=${livePresentationId}&present=1`)}
              className="text-xs font-medium text-green-500 hover:text-green-400 underline underline-offset-2 transition-colors"
            >
              Return to Presenter
            </button>
          )}
        </div>
      )}

      <div className="flex justify-end mb-2">
        <TourTrigger tourId="worship-screen" />
      </div>

      <div className="rounded-lg border overflow-hidden" data-tour="worship-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Background</TableHead>
              <TableHead>Font</TableHead>
              <TableHead>Slides</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {presentations.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    BG_BADGE_COLORS[p.bgId] ?? 'bg-muted text-muted-foreground'
                  }`}>
                    {BG_LABELS[p.bgId] ?? p.bgId}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{FONT_LABELS[p.fontId] ?? p.fontId}</TableCell>
                <TableCell className="text-muted-foreground">{slideCount(p.lyrics)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{timeAgo(p.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => router.push(`/worship/editor?id=${p.id}&present=1`)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Present">
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => router.push(`/worship/editor?id=${p.id}`)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {ConfirmDialogEl}
    </>
  );
};
