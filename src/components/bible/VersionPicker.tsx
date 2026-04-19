'use client';

import { useMemo, useState, type FC } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBibleVersions } from '@/hooks/useBibleVersions';
import type { BibleVersion } from '@/types/bible';

interface VersionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersionId: string;
  onPick: (versionId: string) => void;
}

export const VersionPicker: FC<VersionPickerProps> = ({
  open,
  onOpenChange,
  currentVersionId,
  onPick,
}) => {
  const { data: versions = [], isLoading } = useBibleVersions();
  const [filter, setFilter] = useState('');

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const visible = q
      ? versions.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.abbreviation.toLowerCase().includes(q) ||
            v.language.name.toLowerCase().includes(q),
        )
      : versions;
    const map = new Map<string, BibleVersion[]>();
    for (const v of visible) {
      const key = v.language.name || 'Other';
      const arr = map.get(key) ?? [];
      arr.push(v);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'English') return -1;
      if (b === 'English') return 1;
      return a.localeCompare(b);
    });
  }, [versions, filter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">Select Version</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search versions or languages"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : grouped.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No versions available.</p>
            ) : (
              grouped.map(([lang, list]) => (
                <section key={lang}>
                  <h3 className="sticky top-0 bg-muted/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                    {lang}
                  </h3>
                  <ul className="divide-y">
                    {list.map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onPick(v.id);
                            onOpenChange(false);
                          }}
                          className={cn(
                            'flex w-full flex-col items-start px-4 py-3 text-left hover:bg-accent',
                            v.id === currentVersionId && 'bg-accent/50',
                          )}
                        >
                          <span className="text-sm font-medium">
                            {v.abbreviation} · {v.name}
                          </span>
                          {v.description ? (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {v.description}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
