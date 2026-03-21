'use client';

import { type FC, useState, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetCollaborations } from '@/hooks/useGetCollaborations';
import { CollaborationCard } from './CollaborationCard';
import type { CollaborationInvite, EventInviteStatus } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Tab {
  key: EventInviteStatus | 'ALL';
  label: string;
  icon: JSX.Element;
}

const TABS: Tab[] = [
  { key: 'PENDING',  label: 'Pending',  icon: <Clock        className="h-3.5 w-3.5" /> },
  { key: 'ACCEPTED', label: 'Accepted', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: 'DECLINED', label: 'Declined', icon: <XCircle      className="h-3.5 w-3.5" /> },
];

interface CollaborationsClientProps {
  initialData: CollaborationInvite[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const CollaborationsClient: FC<CollaborationsClientProps> = ({ initialData }) => {
  const [activeTab, setActiveTab] = useState<EventInviteStatus | 'ALL'>('PENDING');
  const { data: invites = initialData } = useGetCollaborations(initialData);

  const pendingCount = invites.filter((i) => i.inviteStatus === 'PENDING').length;

  const filtered = useMemo(
    () => activeTab === 'ALL' ? invites : invites.filter((i) => i.inviteStatus === activeTab),
    [invites, activeTab],
  );

  return (
    <div className="space-y-6">
      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {TABS.map((tab) => {
          const count = invites.filter((i) => i.inviteStatus === tab.key).length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 min-w-[18px] h-[18px] rounded-full text-[11px] font-semibold flex items-center justify-center px-1',
                  tab.key === 'PENDING' && count > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Pending alert banner ── */}
      {pendingCount > 0 && activeTab !== 'PENDING' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4 shrink-0" />
          You have <strong>{pendingCount}</strong> pending collaboration invitation{pendingCount > 1 ? 's' : ''} waiting for your response.
          <button
            onClick={() => setActiveTab('PENDING')}
            className="ml-auto text-xs underline underline-offset-2 hover:no-underline"
          >
            View
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No {activeTab.toLowerCase()} invitations</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'PENDING'
                ? "You're all caught up. No pending collaboration requests."
                : `No ${activeTab.toLowerCase()} invitations yet.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((invite) => (
            <CollaborationCard key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
};
