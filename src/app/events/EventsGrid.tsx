'use client';

import { type FC, useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetEvents } from '@/hooks/useGetEvents';
import { useDeleteEvent } from '@/hooks/useDeleteEvent';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgContext } from '@/providers/OrgContext';
import { EventCard } from './EventCard';
import { EventDialog } from './EventDialog';
import { EventInvitePanel } from './EventInvitePanel';
import type { EventListItem, OrgRole, Organization } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface EventsGridProps {
  initialEvents: EventListItem[];
  role: OrgRole;
  organizations: Organization[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const EventsGrid: FC<EventsGridProps> = ({
  initialEvents,
  role,
  organizations,
}) => {
  const { data: session } = useSession();
  const { activeOrgId } = useOrgContext();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);

  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [inviteEventId, setInviteEventId] = useState<string | null>(null);

  const { data: events = initialEvents, isLoading } = useGetEvents(activeOrgId, initialEvents);
  const inviteEvent = inviteEventId ? (events.find((e) => e.id === inviteEventId) ?? null) : null;
  const { mutate: deleteEvent } = useDeleteEvent();

  const [confirm, ConfirmDialogEl] = useConfirm({
    title: 'Delete Event',
    description: 'This will permanently delete the event and all its collaboration records.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  });

  const canEdit = role !== 'officer';
  const isSuperAdmin = role === 'super_admin';

  // Host org for non-super_admins
  const hostOrgId = isSuperAdmin
    ? (activeOrgId ?? organizations[0]?.id ?? '')
    : (session?.user?.orgId ?? '');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.venue?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, search, typeFilter, statusFilter]);

  const hasFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  const handleDelete = async (event: EventListItem) => {
    const ok = await confirm();
    if (!ok) return;
    deleteEvent(event.id, {
      onSuccess: () => toast.success(`"${event.title}" deleted`),
      onError: () => toast.error('Failed to delete event'),
    });
  };

  const handleEdit = (event: EventListItem) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleInvite = (event: EventListItem) => {
    setInviteEventId(event.id);
    setInvitePanelOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CAMP">Camp</SelectItem>
              <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
              <SelectItem value="SEMINAR">Seminar</SelectItem>
              <SelectItem value="WORSHIP_NIGHT">Worship Night</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              Clear
            </Button>
          )}

          {canEdit && (
            <Button
              onClick={handleCreate}
              disabled={isSuperAdmin && !activeOrgId}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && !activeOrgId && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Select an organization from the top bar to create events.
        </p>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No events found.</p>
          {hasFilters && (
            <Button
              variant="link"
              className="mt-1"
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canEdit={canEdit}
              onEdit={() => handleEdit(event)}
              onDelete={() => handleDelete(event)}
              onInvite={() => handleInvite(event)}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvent={editingEvent}
        hostOrgId={hostOrgId}
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
      />

      {inviteEvent && (
        <EventInvitePanel
          open={invitePanelOpen}
          onOpenChange={setInvitePanelOpen}
          event={inviteEvent}
          organizations={organizations}
        />
      )}

      {ConfirmDialogEl}
    </div>
  );
};
