'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { REMOTE_EVENTS, getRemoteChannelName } from '@/lib/worship-remote';
import type { RemoteNavAction, RemoteState } from '@/types/worship.types';

interface UseWorshipRemoteHostOptions {
  /** Only open the realtime channel while a presentation is live. */
  enabled: boolean;
  title: string;
  slides: string[];
  current: number;
  onGoTo: (index: number) => void;
}

/**
 * Controller side of the phone remote. Opens a Supabase broadcast channel keyed by a
 * random per-presentation token, pushes slide state to phones, and applies their
 * next/prev/goto commands. The token is the only secret — a new one is minted every
 * time a presentation starts, so old links stop working.
 */
export function useWorshipRemoteHost({
  enabled,
  title,
  slides,
  current,
  onGoTo,
}: UseWorshipRemoteHostOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);

  const stateRef = useRef<RemoteState>({ title, current, total: slides.length, slides });
  stateRef.current = { title, current, total: slides.length, slides };
  const goToRef = useRef(onGoTo);
  goToRef.current = onGoTo;

  /* Mint / drop the token as the presentation starts / ends */
  useEffect(() => {
    setToken(enabled ? crypto.randomUUID() : null);
  }, [enabled]);

  /* Channel lifecycle */
  useEffect(() => {
    if (!token) return;

    const sendState = () => {
      if (!subscribedRef.current) return;
      void channel.send({
        type: 'broadcast',
        event: REMOTE_EVENTS.STATE,
        payload: stateRef.current,
      });
    };

    const channel = supabase
      .channel(getRemoteChannelName(token), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: REMOTE_EVENTS.NAV }, ({ payload }) => {
        const nav = payload as RemoteNavAction; // shape defined by our own remote page
        const { current: c } = stateRef.current;
        if (nav.action === 'next') goToRef.current(c + 1);
        else if (nav.action === 'prev') goToRef.current(c - 1);
        else if (nav.action === 'goto' && Number.isInteger(nav.index)) goToRef.current(nav.index);
      })
      .on('broadcast', { event: REMOTE_EVENTS.REQUEST_STATE }, sendState)
      .on('presence', { event: 'sync' }, () => {
        setConnectedCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        subscribedRef.current = status === 'SUBSCRIBED';
        if (subscribedRef.current) sendState();
      });

    channelRef.current = channel;

    return () => {
      subscribedRef.current = false;
      channelRef.current = null;
      setConnectedCount(0);
      void supabase.removeChannel(channel);
    };
  }, [token]);

  /* Push state to phones whenever the slide or deck changes */
  useEffect(() => {
    if (!subscribedRef.current) return;
    void channelRef.current?.send({
      type: 'broadcast',
      event: REMOTE_EVENTS.STATE,
      payload: stateRef.current,
    });
  }, [title, slides, current]);

  return { token, connectedCount };
}
