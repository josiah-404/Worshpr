'use client';

import { useCallback, useRef } from 'react';
import type { TourId } from '@/lib/tours';

export const useTour = () => {
  const driverRef = useRef<ReturnType<typeof import('driver.js')['driver']> | null>(null);

  const startTour = useCallback(async (tourId: TourId) => {
    const { driver } = await import('driver.js');
    const { getTour } = await import('@/lib/tours');

    const tour = getTour(tourId);
    if (!tour) return;

    if (driverRef.current) driverRef.current.destroy();

    driverRef.current = driver({
      animate: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
      steps: tour.steps,
    });

    driverRef.current.drive();
  }, []);

  const stopTour = useCallback(() => {
    driverRef.current?.destroy();
  }, []);

  return { startTour, stopTour };
};
