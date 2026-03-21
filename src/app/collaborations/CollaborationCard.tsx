'use client';

import { type FC } from 'react';
import {
  CalendarDays, MapPin, Building2,
  CheckCircle2, XCircle, Clock, TreePine,
  Heart, BookOpen, Music2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRespondToInvite } from '@/hooks/useRespondToInvite';
import type { CollaborationInvite, EventType, EventStatus, EventInviteStatus } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_GRADIENT: Record<EventType, string> = {
  CAMP:          'from-amber-500 via-orange-500 to-red-500',
  FELLOWSHIP:    'from-blue-500 via-indigo-500 to-violet-500',
  SEMINAR:       'from-violet-600 via-purple-500 to-indigo-500',
  WORSHIP_NIGHT: 'from-rose-500 via-pink-500 to-fuchsia-600',
};

const TYPE_ICON: Record<EventType, JSX.Element> = {
  CAMP:          <TreePine  className="h-16 w-16 text-white/20" />,
  FELLOWSHIP:    <Heart     className="h-16 w-16 text-white/20" />,
  SEMINAR:       <BookOpen  className="h-16 w-16 text-white/20" />,
  WORSHIP_NIGHT: <Music2    className="h-16 w-16 text-white/20" />,
};

const TYPE_LABEL: Record<EventType, string> = {
  CAMP: 'Camp', FELLOWSHIP: 'Fellowship', SEMINAR: 'Seminar', WORSHIP_NIGHT: 'Worship Night',
};

const EVENT_STATUS_STYLE: Record<EventStatus, string> = {
  DRAFT:     'bg-zinc-800/80 text-zinc-300',
  OPEN:      'bg-emerald-950/80 text-emerald-400',
  CLOSED:    'bg-slate-800/80 text-slate-300',
  CANCELLED: 'bg-red-950/80 text-red-400',
  COMPLETED: 'bg-blue-950/80 text-blue-400',
};

const INVITE_STATUS_CONFIG: Record<EventInviteStatus, {
  label: string; icon: JSX.Element; banner: string; text: string;
}> = {
  PENDING: {
    label: 'Pending Response',
    icon: <Clock className="h-4 w-4" />,
    banner: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    text: 'text-amber-500',
  },
  ACCEPTED: {
    label: 'Collaboration Accepted',
    icon: <CheckCircle2 className="h-4 w-4" />,
    banner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    text: 'text-emerald-500',
  },
  DECLINED: {
    label: 'Collaboration Declined',
    icon: <XCircle className="h-4 w-4" />,
    banner: 'bg-destructive/10 border-destructive/20 text-destructive',
    text: 'text-destructive',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const year = s.getFullYear();
  if (s.getFullYear() !== e.getFullYear())
    return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}, ${year}`;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ─────────────────────────────────────────────────────────────

interface CollaborationCardProps {
  invite: CollaborationInvite;
}

export const CollaborationCard: FC<CollaborationCardProps> = ({ invite }) => {
  const { event, inviteStatus, createdAt } = invite;
  const { mutate: respond, isPending } = useRespondToInvite();
  const inviteConfig = INVITE_STATUS_CONFIG[inviteStatus];

  const handleRespond = (status: 'ACCEPTED' | 'DECLINED') => {
    respond(
      { eventId: event.id, orgId: invite.orgId, status },
      {
        onSuccess: () =>
          toast.success(status === 'ACCEPTED' ? 'Collaboration accepted!' : 'Invitation declined'),
        onError: () => toast.error('Failed to respond. Please try again.'),
      },
    );
  };

  return (
    <Card className="overflow-hidden flex flex-col border-border/60">
      {/* ── Cover ── */}
      <div className="relative h-36 overflow-hidden">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', TYPE_GRADIENT[event.type])}>
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            {TYPE_ICON[event.type]}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20">
            {TYPE_LABEL[event.type]}
          </span>
        </div>

        {/* Event status */}
        <div className="absolute top-3 left-3">
          <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md', EVENT_STATUS_STYLE[event.status])}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Event title at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{event.title}</h3>
        </div>
      </div>

      {/* ── Invite status banner ── */}
      <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b text-xs font-semibold', inviteConfig.banner)}>
        {inviteConfig.icon}
        {inviteConfig.label}
        <span className="ml-auto font-normal opacity-70">{formatRelativeTime(createdAt)}</span>
      </div>

      {/* ── Host org ── */}
      <CardContent className="px-4 pt-3 pb-2 space-y-2 flex-1">
        <div className="flex items-center gap-2">
          {event.hostOrg?.orgLogoUrl ? (
            <img
              src={event.hostOrg.orgLogoUrl}
              alt={event.hostOrg.orgName}
              className="h-7 w-7 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center ring-1 ring-border">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold leading-none">{event.hostOrg?.orgName ?? 'Unknown'}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Host Organization</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/50" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>

        {event.venue && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}

        {event.description && (
          <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed pt-0.5">
            {event.description}
          </p>
        )}
      </CardContent>

      {/* ── Actions ── */}
      <CardFooter className="px-4 pb-4 pt-2 border-t border-border/40">
        {inviteStatus === 'PENDING' ? (
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 gap-1.5"
              onClick={() => handleRespond('ACCEPTED')}
              disabled={isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              onClick={() => handleRespond('DECLINED')}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
          </div>
        ) : (
          <div className={cn('flex items-center gap-2 text-xs font-medium w-full', inviteConfig.text)}>
            {inviteConfig.icon}
            <span>{inviteStatus === 'ACCEPTED' ? 'You are collaborating on this event.' : 'You declined this invitation.'}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
