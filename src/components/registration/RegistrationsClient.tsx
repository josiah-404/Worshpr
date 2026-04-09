'use client';

import { type FC, useState, useMemo } from 'react';
import { Search, X, CheckCircle2, Clock, XCircle, Ban, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RegistrationDrawer } from '@/components/registration/RegistrationDrawer';
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
  PENDING:   { label: 'Pending',   icon: Clock,       className: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  APPROVED:  { label: 'Approved',  icon: CheckCircle2, className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  REJECTED:  { label: 'Rejected',  icon: XCircle,     className: 'text-destructive bg-destructive/10 border-destructive/30' },
  CANCELLED: { label: 'Cancelled', icon: Ban,         className: 'text-muted-foreground bg-muted border-border' },
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface RegistrationsClientProps {
  initialData: RegistrationListItem[];
  orgId: string | null;
  events: EventListItem[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const RegistrationsClient: FC<RegistrationsClientProps> = ({
  initialData,
  orgId,
  events,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [selected, setSelected] = useState<RegistrationListItem | null>(null);

  const params = useMemo(() => ({
    ...(orgId ? { orgId } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(eventFilter !== 'ALL' ? { eventId: eventFilter } : {}),
  }), [orgId, statusFilter, eventFilter]);

  const { data: registrations = initialData, isLoading } = useGetRegistrations(params, initialData);

  const filtered = useMemo(() => {
    if (!search.trim()) return registrations;
    const q = search.toLowerCase();
    return registrations.filter((r) =>
      r.registrant.fullName.toLowerCase().includes(q) ||
      r.registrant.email.toLowerCase().includes(q) ||
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

  const hasFilters = search || statusFilter !== 'ALL' || eventFilter !== 'ALL';

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, icon: Users, className: 'text-foreground' },
          { label: 'Pending', value: counts.pending, icon: Clock, className: 'text-amber-500' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, className: 'text-emerald-500' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, className: 'text-destructive' },
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
            placeholder="Search name, email, or code..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Events</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setEventFilter('ALL'); }}
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
            <Button variant="link" size="sm" onClick={() => { setSearch(''); setStatusFilter('ALL'); setEventFilter('ALL'); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registrant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Event</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Submitted</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((reg) => {
                const s = STATUS_CONFIG[reg.status];
                const Icon = s.icon;
                const eventTitle = events.find((e) => e.id === reg.eventId)?.title ?? '—';
                return (
                  <tr
                    key={reg.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(reg)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{reg.registrant.fullName}</p>
                      <p className="text-xs text-muted-foreground">{reg.registrant.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="truncate max-w-[180px]">{eventTitle}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs">{reg.group.confirmationCode}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {format(new Date(reg.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('gap-1 text-xs', s.className)}>
                        <Icon className="h-3 w-3" />
                        {s.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RegistrationDrawer registration={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
