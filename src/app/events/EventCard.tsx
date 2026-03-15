'use client';

import { type FC } from 'react';
import { CalendarDays, MapPin, Users, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Event, EventType, EventStatus } from '@/types/event.types';

interface EventCardProps {
  event: Event;
  canManage: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG: Record<EventType, { label: string; gradient: string; badge: string }> = {
  camp: {
    label: 'Camp',
    gradient: 'from-orange-500/30 via-amber-500/20 to-yellow-500/10',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  fellowship: {
    label: 'Fellowship',
    gradient: 'from-blue-500/30 via-indigo-500/20 to-sky-500/10',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  seminar: {
    label: 'Seminar',
    gradient: 'from-purple-500/30 via-violet-500/20 to-fuchsia-500/10',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-muted/80 text-muted-foreground border-border' },
  open:      { label: 'Open',      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  closed:    { label: 'Closed',    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { label: 'Completed', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

export const EventCard: FC<EventCardProps> = ({ event, canManage, onEdit, onDelete }) => {
  const typeConfig = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.fellowship;
  const statusConfig = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
  const slotsLeft =
    event.maxSlots !== null ? event.maxSlots - event._count.registrations : null;

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/20">
      {/* Cover */}
      <div className="relative h-36 shrink-0 overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.theme}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn('h-full w-full bg-gradient-to-br', typeConfig.gradient)} />
        )}

        {/* Status badge — top left */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="outline" className={cn('text-xs font-medium backdrop-blur-sm', statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Type badge — top right */}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant="outline" className={cn('text-xs font-medium backdrop-blur-sm', typeConfig.badge)}>
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.theme}</h3>
          {event.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {event._count.registrations} registered
              {slotsLeft !== null && (
                <span className={cn('ml-1', slotsLeft <= 5 ? 'text-red-400' : '')}>
                  · {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Registration info */}
        <div className="flex items-center justify-between text-xs border-t pt-3">
          <span className="text-muted-foreground">
            {event.registrationFee > 0
              ? `₱${event.registrationFee.toLocaleString()}`
              : 'Free'}
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              event.isOpen
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-muted/50 text-muted-foreground',
            )}
          >
            {event.isOpen ? 'Reg. Open' : 'Reg. Closed'}
          </Badge>
        </div>
      </div>

      {/* Footer actions */}
      {canManage && (
        <div className="flex items-center justify-end gap-1 border-t px-3 py-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(event)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
