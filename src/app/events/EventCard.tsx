'use client';

import { type FC, useState } from 'react';
import {
  CalendarDays, MapPin, Building2, Users,
  Pencil, Trash2, TreePine, Heart, BookOpen, Music2, UserPlus, QrCode,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRModal } from '@/components/events/QRModal';
import { cn } from '@/lib/utils';
import type { EventListItem, EventType, EventStatus } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_GRADIENT: Record<EventType, string> = {
  CAMP:          'from-amber-500 via-orange-500 to-red-500',
  FELLOWSHIP:    'from-blue-500 via-indigo-500 to-violet-500',
  SEMINAR:       'from-violet-600 via-purple-500 to-indigo-500',
  WORSHIP_NIGHT: 'from-rose-500 via-pink-500 to-fuchsia-600',
};

const TYPE_ICON: Record<EventType, JSX.Element> = {
  CAMP:          <TreePine  className="h-20 w-20 text-white/20" />,
  FELLOWSHIP:    <Heart     className="h-20 w-20 text-white/20" />,
  SEMINAR:       <BookOpen  className="h-20 w-20 text-white/20" />,
  WORSHIP_NIGHT: <Music2    className="h-20 w-20 text-white/20" />,
};

const TYPE_LABEL: Record<EventType, string> = {
  CAMP:          'Camp',
  FELLOWSHIP:    'Fellowship',
  SEMINAR:       'Seminar',
  WORSHIP_NIGHT: 'Worship Night',
};

const STATUS_CONFIG: Record<EventStatus, { label: string; dot: string; pill: string }> = {
  DRAFT:     { label: 'Draft',     dot: 'bg-zinc-400',    pill: 'bg-zinc-800/80 text-zinc-300' },
  OPEN:      { label: 'Open',      dot: 'bg-emerald-400', pill: 'bg-emerald-950/80 text-emerald-400' },
  CLOSED:    { label: 'Closed',    dot: 'bg-slate-400',   pill: 'bg-slate-800/80 text-slate-300' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-950/80 text-red-400' },
  COMPLETED: { label: 'Completed', dot: 'bg-blue-400',    pill: 'bg-blue-950/80 text-blue-400' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sStr = s.toLocaleDateString('en-US', opts);
  const eStr = e.toLocaleDateString('en-US', opts);
  const year = s.getFullYear();
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  }
  if (sStr === eStr) return `${sStr}, ${year}`;
  return `${sStr} – ${eStr}, ${year}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface EventCardProps {
  event: EventListItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}

export const EventCard: FC<EventCardProps> = ({ event, canEdit, onEdit, onDelete, onInvite }) => {
  const hostOrg = event.organizations.find((o) => o.role === 'HOST');
  const [qrOpen, setQrOpen] = useState(false);
  const registrationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register/${event.slug}`
    : `/register/${event.slug}`;

  const dateRange = formatDateRange(event.startDate, event.endDate);

  const collaborators = event.organizations.filter(
    (o) => o.role === 'COLLABORATOR' && o.inviteStatus === 'ACCEPTED',
  );
  const status = STATUS_CONFIG[event.status];

  return (
    <Card className="overflow-hidden flex flex-col group border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">

      {/* ── Cover ── */}
      <div className="relative aspect-[4/3] overflow-hidden">

        {/* Image or gradient fallback */}
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', TYPE_GRADIENT[event.type])}>
            {/* Dot pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {TYPE_ICON[event.type]}
          </div>
        )}

        {/* Dark gradient at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Status pill — top left */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md',
            status.pill,
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
        </div>

        {/* Type badge — top right */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20">
            {TYPE_LABEL[event.type]}
          </span>
        </div>

        {/* Title + org overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 drop-shadow">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            {hostOrg?.orgLogoUrl ? (
              <img
                src={hostOrg.orgLogoUrl}
                alt={hostOrg.orgName}
                className="h-4 w-4 rounded-full object-cover ring-1 ring-white/30"
              />
            ) : (
              <Building2 className="h-3 w-3 text-white/60" />
            )}
            <span className="text-[11px] text-white/75 truncate">
              {hostOrg?.orgName ?? '—'}
              {collaborators.length > 0 && (
                <span className="text-white/50 ml-1">
                  +{collaborators.length} more
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Meta ── */}
      <CardContent className="px-4 pt-3 pb-2 flex-1 space-y-2">
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
          <p className="text-xs text-muted-foreground/60 line-clamp-2 pt-0.5 leading-relaxed">
            {event.description}
          </p>
        )}
      </CardContent>

      {/* ── Footer ── */}
      <CardFooter className="px-4 pb-4 pt-2 flex flex-col gap-2 border-t border-border/40">
        {/* Row 1: fee + slots */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              event.fee === 0
                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
            )}>
              {event.fee === 0 ? 'Free' : `₱${event.fee.toLocaleString()}`}
            </span>
            {event.maxSlots && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {event.maxSlots.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setQrOpen(true)}
              title="Show QR code"
            >
              <QrCode className="h-3.5 w-3.5" />
            </Button>
            {canEdit && (
              <>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Row 2: invite collaborators button */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 border-dashed hover:border-solid"
            onClick={onInvite}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Manage Collaborators
            {collaborators.length > 0 && (
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                {collaborators.length}
              </span>
            )}
          </Button>
        )}
      </CardFooter>

      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        eventTitle={event.title}
        orgName={hostOrg?.orgName ?? ''}
        dateRange={dateRange}
        venue={event.venue}
        registrationUrl={registrationUrl}
      />
    </Card>
  );
};
