'use client';

import { type FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-[340px] p-8 flex flex-col items-center text-center gap-0">

        {/* ── Icon ── */}
        {variant === 'destructive' && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 mb-5">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        )}

        {/* ── Title ── */}
        <DialogTitle className="text-xl font-bold mb-2">{title}</DialogTitle>

        {/* ── Description ── */}
        {description && (
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed mb-7">
            {description}
          </DialogDescription>
        )}

        {/* ── Buttons ── */}
        <div className="flex w-full gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
