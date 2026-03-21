'use client';

import { useState, createElement, type ReactElement } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/common/ConfirmDialog';

type ConfirmOptions = Omit<ConfirmDialogProps, 'open' | 'onConfirm' | 'onCancel'>;

/**
 * Returns a [confirm, DialogElement] tuple.
 * Call `await confirm()` to open the dialog — resolves true on confirm, false on cancel.
 * Render `DialogElement` somewhere in your JSX.
 *
 * @example
 * const [confirm, ConfirmEl] = useConfirm({ title: 'Delete?', variant: 'destructive' });
 * const ok = await confirm();
 * if (ok) doDelete();
 * // In JSX: {ConfirmEl}
 */
export function useConfirm(options: ConfirmOptions): [() => Promise<boolean>, ReactElement] {
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });

  const handleConfirm = () => {
    resolver?.(true);
    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.(false);
    setResolver(null);
  };

  const dialog = createElement(ConfirmDialog, {
    ...options,
    open: resolver !== null,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  });

  return [confirm, dialog];
}
