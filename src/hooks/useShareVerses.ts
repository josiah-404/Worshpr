'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { formatCopyText, type CopyPayload } from './useCopyVerses';

export const useShareVerses = () =>
  useCallback(async (payload: CopyPayload) => {
    const text = formatCopyText(payload);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ text, title: 'Scripture' });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', { description: 'Share API unavailable.' });
    } catch {
      toast.error('Share failed');
    }
  }, []);
