'use client';

import { useState, useMemo, type FC } from 'react';
import { PlusCircle, CalendarX } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventCard } from '@/app/events/EventCard';
import { EventDialog } from '@/app/events/EventDialog';
import { useEvents } from '@/hooks/useEvents';
import { useOrgContext } from '@/providers/OrgContext';
import type { Event } from '@/types/event.types';
import type { Organization } from '@/types';
import type { CreateEventInput } from '@/validations/event.schema';

interface EventsGridProps {
  initialEvents: Event[];
  organizations: Organization[];
}

const ALL = '__ALL__';

export const EventsGrid: FC<EventsGridProps> = ({ initialEvents, organizations }) => {
  const { data: session } = useSession();
  const { activeOrgId } = useOrgContext();
  const { events, loading, error, setError, createEvent, updateEvent, deleteEvent } =
    useEvents(initialEvents);

  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const canManage = session?.user?.role !== 'officer';

  function openCreate() {
    setEditingEvent(null);
    setError('');
    setOpen(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setError('');
    setOpen(true);
  }

  async function handleSubmit(values: CreateEventInput) {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, values);
      } else {
        await createEvent(values);
      }
      setOpen(false);
    } catch {
      // error already shown via setError in useEvents — keep dialog open
    }
  }

  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      if (activeOrgId && e.orgId !== activeOrgId) return false;
      if (typeFilter !== ALL && e.type !== typeFilter) return false;
      if (statusFilter !== ALL && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          e.theme.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.venue ?? '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [events, activeOrgId, typeFilter, statusFilter, search]);

  const hasFilters = search !== '' || typeFilter !== ALL || statusFilter !== ALL;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Types</SelectItem>
              <SelectItem value="camp">Camp</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs"
              onClick={() => {
                setSearch('');
                setTypeFilter(ALL);
                setStatusFilter(ALL);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {canManage && (
          <Button onClick={openCreate} size="sm" className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" /> New Event
          </Button>
        )}
      </div>

      {/* Grid */}
      {visibleEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center gap-3">
          <CalendarX className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {hasFilters ? 'No events match your filters' : 'No events yet'}
            </p>
            {!hasFilters && canManage && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Create your first event to get started
              </p>
            )}
          </div>
          {!hasFilters && canManage && (
            <Button onClick={openCreate} size="sm" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> New Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={deleteEvent}
            />
          ))}
        </div>
      )}

      <EventDialog
        open={open}
        onOpenChange={setOpen}
        editingEvent={editingEvent}
        organizations={organizations}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  );
};
