import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CollaborationsClient } from './CollaborationsClient';
import type { CollaborationInvite } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CollaborationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect('/login');
  if (session.user.role === 'super_admin' || !session.user.orgId) redirect('/events');

  const orgId = session.user.orgId;

  const raw = await prisma.eventOrganization.findMany({
    where: { orgId, role: 'COLLABORATOR' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      eventId: true,
      orgId: true,
      role: true,
      inviteStatus: true,
      invitedBy: true,
      respondedAt: true,
      createdAt: true,
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          venue: true,
          coverImage: true,
          fee: true,
          description: true,
          organizations: {
            where: { role: 'HOST' },
            select: {
              orgId: true,
              organization: { select: { name: true, logoUrl: true } },
            },
            take: 1,
          },
        },
      },
    },
  });

  const invites: CollaborationInvite[] = raw.map((invite) => {
    const hostEntry = invite.event.organizations[0] ?? null;
    return {
      id: invite.id,
      eventId: invite.eventId,
      orgId: invite.orgId,
      role: invite.role as 'HOST' | 'COLLABORATOR',
      inviteStatus: invite.inviteStatus as 'PENDING' | 'ACCEPTED' | 'DECLINED',
      invitedBy: invite.invitedBy,
      respondedAt: invite.respondedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
      event: {
        id: invite.event.id,
        title: invite.event.title,
        slug: invite.event.slug,
        type: invite.event.type as CollaborationInvite['event']['type'],
        status: invite.event.status as CollaborationInvite['event']['status'],
        startDate: invite.event.startDate.toISOString(),
        endDate: invite.event.endDate.toISOString(),
        venue: invite.event.venue,
        coverImage: invite.event.coverImage,
        fee: invite.event.fee,
        description: invite.event.description,
        hostOrg: hostEntry
          ? {
              orgId: hostEntry.orgId,
              orgName: hostEntry.organization.name,
              orgLogoUrl: hostEntry.organization.logoUrl,
            }
          : null,
      },
    };
  });

  const pendingCount = invites.filter((i) => i.inviteStatus === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Collaborations</h1>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage collaboration invitations from other organizations
        </p>
      </div>

      <CollaborationsClient initialData={invites} />
    </div>
  );
}
