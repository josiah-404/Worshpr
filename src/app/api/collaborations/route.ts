import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, orgId } = session.user;

    // Only org_admin has an org that can receive invites
    if (role === 'super_admin' || !orgId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const invites = await prisma.eventOrganization.findMany({
      where: {
        orgId,
        role: 'COLLABORATOR',
      },
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
                organization: {
                  select: { name: true, logoUrl: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    const data = invites.map((invite) => {
      const hostEntry = invite.event.organizations[0] ?? null;
      return {
        id: invite.id,
        eventId: invite.eventId,
        orgId: invite.orgId,
        role: invite.role,
        inviteStatus: invite.inviteStatus,
        invitedBy: invite.invitedBy,
        respondedAt: invite.respondedAt?.toISOString() ?? null,
        createdAt: invite.createdAt.toISOString(),
        event: {
          id: invite.event.id,
          title: invite.event.title,
          slug: invite.event.slug,
          type: invite.event.type,
          status: invite.event.status,
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

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch collaborations' }, { status: 500 });
  }
}
