'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { REMOTE_EVENTS, getRemoteChannelName } from '@/lib/worship-remote';
import type { RemoteNavAction, RemoteState } from '@/types/worship.types';

export type RemoteConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/** No state from the controller for this long → treat the presentation as ended / unreachable. */
const STATE_TIMEOUT_MS = 6_000;

/** Phone side of the remote: receives slide state and sends next/prev/goto commands. */
export function useWorshipRemoteClient(token: string) {
  const [state, setState] = useState<RemoteState | null>(null);
  const [status, setStatus] = useState<RemoteConnectionStatus>('connecting');
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const armTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setStatus('disconnected'), STATE_TIMEOUT_MS);
    };

    const channel = supabase
      .channel(getRemoteChannelName(token), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: REMOTE_EVENTS.STATE }, ({ payload }) => {
        setState(payload as RemoteState); // shape defined by useWorshipRemoteHost
        setStatus('connected');
        clearTimeout(timeout);
      })
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          void channel.track({ joinedAt: Date.now() });
          void channel.send({ type: 'broadcast', event: REMOTE_EVENTS.REQUEST_STATE, payload: {} });
          armTimeout();
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('disconnected');
        }
      });

    channelRef.current = channel;

    /* Phones drop sockets when the screen locks — re-request state when we come back */
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void channel.send({ type: 'broadcast', event: REMOTE_EVENTS.REQUEST_STATE, payload: {} });
      armTimeout();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisible);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [token]);

  const send = useCallback((nav: RemoteNavAction) => {
    navigator.vibrate?.(15);
    void channelRef.current?.send({ type: 'broadcast', event: REMOTE_EVENTS.NAV, payload: nav });
  }, []);

  const retry = useCallback(() => {
    setStatus('connecting');
    void channelRef.current?.send({ type: 'broadcast', event: REMOTE_EVENTS.REQUEST_STATE, payload: {} });
    setTimeout(() => setStatus((s) => (s === 'connecting' ? 'disconnected' : s)), STATE_TIMEOUT_MS);
  }, []);

  return { state, status, send, retry };
}
