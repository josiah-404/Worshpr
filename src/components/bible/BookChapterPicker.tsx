'use client';

import { useMemo, useState, type FC } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBibleBooks } from '@/hooks/useBibleBooks';
import type { Book } from '@/types/bible';

interface BookChapterPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bibleId: string;
  currentBookId: string;
  onPick: (bookId: string, chapter: string) => void;
}

export const BookChapterPicker: FC<BookChapterPickerProps> = ({
  open,
  onOpenChange,
  bibleId,
  currentBookId,
  onPick,
}) => {
  const { data: books = [], isLoading } = useBibleBooks(bibleId);
  const [filter, setFilter] = useState('');
  const [stagedBook, setStagedBook] = useState<Book | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.abbreviation?.toLowerCase().includes(q) ?? false),
    );
  }, [books, filter]);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setStagedBook(null);
      setFilter('');
    }
    onOpenChange(v);
  };

  const currentBook = stagedBook ?? books.find((b) => b.id === currentBookId) ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            {stagedBook ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setStagedBook(null)}
                  aria-label="Back to books"
                >
                  <ChevronLeft />
                </Button>
                <span>{stagedBook.name}</span>
              </>
            ) : (
              <span>Select Book</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!stagedBook ? (
          <div className="flex max-h-[70vh] flex-col">
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search books"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No matches.</p>
              ) : (
                <ul className="divide-y">
                  {filtered.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent',
                          b.id === currentBookId && 'bg-accent/50 font-semibold',
                        )}
                        onClick={() => setStagedBook(b)}
                      >
                        <span>{b.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {b.chapterCount} ch
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
              {Array.from({ length: currentBook?.chapterCount ?? 0 }, (_, i) => i + 1).map(
                (n) => (
                  <Button
                    key={n}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onPick(stagedBook.id, String(n));
                      handleOpenChange(false);
                    }}
                  >
                    {n}
                  </Button>
                ),
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
