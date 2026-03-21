'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { deletePresentation } from '@/services/presentation.service';
import type { Presentation } from '@/types';

export type { Presentation };

export function usePresentations(initialPresentations: Presentation[]) {
  const [presentations, setPresentations] = useState<Presentation[]>(initialPresentations);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDeletePresentation(id: string) {
    setDeleting(id);
    try {
      await deletePresentation(id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      toast.success('Presentation deleted');
    } catch {
      toast.error('Delete failed', { description: 'Failed to delete presentation.' });
    } finally {
      setDeleting(null);
    }
  }

  return { presentations, deleting, deletePresentation: handleDeletePresentation };
}
