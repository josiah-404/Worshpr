'use client';

import { useEffect, useState } from 'react';

export function useIsPresentationActive(): boolean {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('worship-presenter');
    let timeout: ReturnType<typeof setTimeout>;

    const markActive = () => {
      setIsActive(true);
      clearTimeout(timeout);
      // If no heartbeat within 8s, assume the presenter tab was closed unexpectedly
      timeout = setTimeout(() => setIsActive(false), 8_000);
    };

    channel.onmessage = (e) => {
      if (e.data?.type === 'PRESENTER_HEARTBEAT') markActive();
      if (e.data?.type === 'PRESENTER_CLOSED') {
        clearTimeout(timeout);
        setIsActive(false);
      }
    };

    // Ping immediately — presenter will respond with PRESENTER_HEARTBEAT if active
    channel.postMessage({ type: 'PING' });

    return () => {
      clearTimeout(timeout);
      channel.close();
    };
  }, []);

  return isActive;
}
