'use client';

import { type FC, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour } from '@/hooks/useTour';
import type { TourId } from '@/lib/tours';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourTriggerProps {
  tourId: TourId;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TourTrigger: FC<TourTriggerProps> = ({ tourId }) => {
  const { startTour } = useTour();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Auto-start if ?tour=1 is in the URL, then clean the param
  useEffect(() => {
    if (searchParams.get('tour') !== '1') return;

    // Small delay so the page DOM is ready
    const t = setTimeout(() => {
      startTour(tourId);
      router.replace(pathname, { scroll: false });
    }, 400);

    return () => clearTimeout(t);
  }, [searchParams, tourId, startTour, router, pathname]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => startTour(tourId)}
    >
      <HelpCircle className="h-4 w-4" />
      Take a Tour
    </Button>
  );
};
