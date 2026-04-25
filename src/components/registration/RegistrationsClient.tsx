'use client';

import { type FC, useState, useMemo } from 'react';
import { Search, X, CheckCircle2, Clock, XCircle, Ban, Users, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RegistrationDrawer } from '@/components/registration/RegistrationDrawer';
import { TourTrigger } from '@/components/guides/TourTrigger';
import { useGetRegistrations } from '@/hooks/useGetRegistrations';
import { cn } from '@/lib/utils';
import type { RegistrationListItem, RegistrationStatus, EventListItem } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ALL',       label: 'All Status' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'APPROVED',  label: 'Approved' },
  { value: 'REJECTED',  label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; icon: React.ElementType; className: string }> = {
  PENDING:   { label: 'Pending',   icon: Clock,        className: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  APPROVED:  { label: 'Approved',  icon: CheckCircle2, className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  REJECTED:  { label: 'Rejected',  icon: XCircle,      className: 'text-destructive bg-destructive/10 border-destructive/30' },
  CANCELLED: { label: 'Cancelled', icon: Ban,          className: 'text-muted-foreground bg-muted border-border' },
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface RegistrationsClientProps {
  initialData: RegistrationListItem[];
  events: EventListItem[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const RegistrationsClient: FC<RegistrationsClientProps> = ({
  initialData,
  events,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Event is required — empty string means none selected yet
  const [eventFilter, setEventFilter] = useState('');
  const [selected, setSelected] = useState<RegistrationListItem | null>(null);

  const eventSelected = eventFilter !== '';

  const params = useMemo(() => ({
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(eventSelected ? { eventId: eventFilter } : {}),
  }), [statusFilter, eventFilter, eventSelected]);

  const { data: fetchedRegistrations, isLoading } = useGetRegistrations(
    params,
    { enabled: eventSelected },
  );

  // Only show data when an event is selected
  const registrations = eventSelected
    ? (fetchedRegistrations ?? [])
    : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return registrations;
    const q = search.toLowerCase();
    return registrations.filter((r) =>
      r.registrant.fullName.toLowerCase().includes(q) ||
      r.registrant.email.toLowerCase().includes(q) ||
      (r.registrant.churchName ?? '').toLowerCase().includes(q) ||
      (r.registrant.divisionOrgName ?? '').toLowerCase().includes(q) ||
      r.group.confirmationCode.toLowerCase().includes(q),
    );
  }, [registrations, search]);

  // Summary counts
  const counts = useMemo(() => ({
    total:     registrations.length,
    pending:   registrations.filter((r) => r.status === 'PENDING').length,
    approved:  registrations.filter((r) => r.status === 'APPROVED').length,
    rejected:  registrations.filter((r) => r.status === 'REJECTED').length,
    cancelled: registrations.filter((r) => r.status === 'CANCELLED').length,
  }), [registrations]);

  const hasFilters = search || statusFilter !== 'ALL';

  const selectedEventTitle = events.find((e) => e.id === eventFilter)?.title;

  return (
    <div className="flex flex-col gap-4">
      {/* Event selector — always visible, required */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[260px]" data-tour="reg-event-filter">
            <SelectValue placeholder="Select an event…" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eventSelected && (
          <span className="text-xs text-muted-foreground">
            Showing registrations for <span className="font-medium text-foreground">{selectedEventTitle}</span>
          </span>
        )}
        <div className="ml-auto">
          <TourTrigger tourId="registrations" />
        </div>
      </div>

      {/* Prompt state — no event selected */}
      {!eventSelected ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3 rounded-lg border border-dashed">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium">Select an event</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose an event above to view its registrations
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',    value: counts.total,     icon: Users,        className: 'text-foreground' },
              { label: 'Pending',  value: counts.pending,   icon: Clock,        className: 'text-amber-500' },
              { label: 'Approved', value: counts.approved,  icon: CheckCircle2, className: 'text-emerald-500' },
              { label: 'Rejected', value: counts.rejected,  icon: XCircle,      className: 'text-destructive' },
            ].map(({ label, value, icon: Icon, className }) => (
              <div key={label} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
                <Icon className={cn('h-5 w-5 shrink-0', className)} />
                <div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-tour="reg-search"
                placeholder="Search name, email, church, or code…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-tour="reg-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No registrations found</p>
              {hasFilters && (
                <Button variant="link" size="sm" onClick={() => { setSearch(''); setStatusFilter('ALL'); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden" data-tour="reg-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registrant</TableHead>
                    <TableHead className="hidden sm:table-cell">Church</TableHead>
                    <TableHead className="hidden md:table-cell">Division</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((reg) => {
                    const s = STATUS_CONFIG[reg.status];
                    const Icon = s.icon;
                    return (
                      <TableRow
                        key={reg.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(reg)}
                      >
                        <TableCell>
                          <p className="font-medium">{reg.registrant.fullName}</p>
                          <p className="text-xs text-muted-foreground">{reg.registrant.email}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {reg.registrant.churchName ?? <span className="italic text-muted-foreground/50">—</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {reg.registrant.divisionOrgName ?? <span className="italic text-muted-foreground/50">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {format(new Date(reg.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('gap-1 text-xs', s.className)}>
                            <Icon className="h-3 w-3" />
                            {s.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <RegistrationDrawer registration={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
