import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventOrgFilterWhere } from '@/lib/event-access';
import { OrgAccessError, resolveFilterOrgIds } from '@/lib/org-access';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryOrgId = req.nextUrl.searchParams.get('orgId');
    const orgIds = resolveFilterOrgIds(session, queryOrgId);
    const orgFilter = eventOrgFilterWhere(orgIds);

    const events = await prisma.event.findMany({
      where: orgFilter
        ? {
            organizations: {
              some: {
                orgId: orgFilter.organizations.some.orgId,
                inviteStatus: 'ACCEPTED',
              },
            },
          }
        : { organizations: { some: { inviteStatus: 'ACCEPTED' } } },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
        coverImage: true,
        idTemplate: { select: { id: true } },
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    const data = events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      status: e.status,
      coverImage: e.coverImage,
      hasTemplate: !!e.idTemplate,
      approvedCount: e._count.registrations,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
