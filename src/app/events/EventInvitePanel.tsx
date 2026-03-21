'use client';

import { type FC, useState } from 'react';
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useInviteOrg } from '@/hooks/useInviteOrg';
import type { EventListItem, EventOrg, Organization } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

const INVITE_STATUS_ICON = {
  ACCEPTED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  PENDING: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  DECLINED: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

const INVITE_STATUS_LABEL = {
  ACCEPTED: 'Accepted',
  PENDING: 'Pending',
  DECLINED: 'Declined',
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface EventInvitePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventListItem;
  organizations: Organization[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const EventInvitePanel: FC<EventInvitePanelProps> = ({
  open,
  onOpenChange,
  event,
  organizations,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const { mutate: invite, isPending } = useInviteOrg(event.id);

  const invitedOrgIds = new Set(event.organizations.map((o) => o.orgId));
  const availableOrgs = organizations.filter((o) => !invitedOrgIds.has(o.id));

  const sortedOrgs: EventOrg[] = [
    ...event.organizations.filter((o) => o.role === 'HOST'),
    ...event.organizations.filter((o) => o.role === 'COLLABORATOR'),
  ];

  const handleInvite = () => {
    if (!selectedOrgId) return;
    invite(
      { orgId: selectedOrgId, role: 'COLLABORATOR' },
      {
        onSuccess: () => {
          toast.success('Invite sent');
          setSelectedOrgId('');
        },
        onError: () => toast.error('Failed to send invite'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Current org list ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Organizations
            </p>
            <div className="space-y-2">
              {sortedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {org.orgLogoUrl ? (
                      <img
                        src={org.orgLogoUrl}
                        alt={org.orgName}
                        className="h-6 w-6 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{org.orgName}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {org.role.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {INVITE_STATUS_ICON[org.inviteStatus]}
                    <span className="text-xs text-muted-foreground">
                      {INVITE_STATUS_LABEL[org.inviteStatus]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Invite new org ── */}
          {availableOrgs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Invite Organization
              </p>
              <div className="flex gap-2">
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={!selectedOrgId || isPending}>
                  {isPending ? 'Sending...' : 'Invite'}
                </Button>
              </div>
            </div>
          )}

          {availableOrgs.length === 0 && sortedOrgs.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              All organizations have been invited.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
