import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, orgId } = session.user;
    const queryOrgId = req.nextUrl.searchParams.get('orgId');

    // super_admin: filter by activeOrgId if provided, else return all
    // org_admin / officer: always filter by their own org
    const filterOrgId =
      role === 'super_admin' ? (queryOrgId ?? undefined) : (orgId ?? undefined);

    const events = await prisma.event.findMany({
      where: filterOrgId
        ? { organizations: { some: { orgId: filterOrgId, inviteStatus: 'ACCEPTED' } } }
        : undefined,
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
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
