import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEventSchema } from '@/validations/event.schema';
import { slugify } from '@/lib/slugify';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, orgId } = session.user;
    const queryOrgId = req.nextUrl.searchParams.get('orgId');

    // super_admin: filter by activeOrgId if provided, else return all
    // org_admin / officer: always filter by their org
    const filterOrgId =
      role === 'super_admin' ? (queryOrgId ?? undefined) : (orgId ?? undefined);

    const events = await prisma.event.findMany({
      where: filterOrgId
        ? { organizations: { some: { orgId: filterOrgId } } }
        : undefined,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        venue: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        fee: true,
        maxSlots: true,
        status: true,
        coverImage: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        organizations: {
          select: {
            id: true,
            orgId: true,
            role: true,
            inviteStatus: true,
            organization: {
              select: { name: true, logoUrl: true },
            },
          },
        },
      },
    });

    const data = events.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      registrationDeadline: e.registrationDeadline?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      organizations: e.organizations.map((o) => ({
        id: o.id,
        orgId: o.orgId,
        orgName: o.organization.name,
        orgLogoUrl: o.organization.logoUrl,
        role: o.role,
        inviteStatus: o.inviteStatus,
      })),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role === 'officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { hostOrgId, coverImage, registrationDeadline, maxSlots, ...rest } = parsed.data;

    // org_admin can only create events for their own org
    if (session.user.role === 'org_admin' && hostOrgId !== session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baseSlug = slugify(rest.title);
    const suffix = Math.random().toString(36).slice(-6);
    const slug = `${baseSlug}-${suffix}`;

    const event = await prisma.event.create({
      data: {
        ...rest,
        slug,
        startDate: new Date(rest.startDate),
        endDate: new Date(rest.endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxSlots: maxSlots ?? null,
        coverImage: coverImage || null,
        createdBy: session.user.id,
        organizations: {
          create: {
            orgId: hostOrgId,
            role: 'HOST',
            inviteStatus: 'ACCEPTED',
            invitedBy: session.user.id,
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        venue: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        fee: true,
        maxSlots: true,
        status: true,
        coverImage: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        organizations: {
          select: {
            id: true,
            orgId: true,
            role: true,
            inviteStatus: true,
            organization: { select: { name: true, logoUrl: true } },
          },
        },
      },
    });

    const data = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organizations: event.organizations.map((o) => ({
        id: o.id,
        orgId: o.orgId,
        orgName: o.organization.name,
        orgLogoUrl: o.organization.logoUrl,
        role: o.role,
        inviteStatus: o.inviteStatus,
      })),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const isPrismaUniqueError =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002';
    if (isPrismaUniqueError) {
      return NextResponse.json({ error: 'An event with this title already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
