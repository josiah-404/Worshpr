import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createEventSchema } from '@/validations/event.schema';
import { slugify } from '@/lib/slugify';
import { resolveFilterOrgIds, assertCanManageOrg, OrgAccessError } from '@/lib/org-access';
import { eventOrgFilterWhere } from '@/lib/event-access';
import { buildQuestionTree } from '@/lib/eventQuestions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryOrgId = req.nextUrl.searchParams.get('orgId');
    const filterOrgIds = resolveFilterOrgIds(session, queryOrgId);

    const events = await prisma.event.findMany({
      where: eventOrgFilterWhere(filterOrgIds),
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        customType: true,
        venue: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        maxSlots: true,
        status: true,
        coverImage: true,
        themeColor: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        paymentAccount: {
          select: {
            id: true,
            method: true,
            label: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
            qrCodeUrl: true,
            instructions: true,
          },
        },
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
        feeItems: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, amount: true, isRequired: true, order: true },
        },
        registrantTypes: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, order: true },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true, parentQuestionId: true, triggerOption: true,
            label: true, type: true, options: true, isRequired: true, order: true,
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
      questions: buildQuestionTree(e.questions),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { hostOrgId, coverImage, themeColor, paymentAccountId, registrationDeadline, maxSlots, customType, ...rest } = parsed.data;

    assertCanManageOrg(session, hostOrgId);

    const baseSlug = slugify(rest.title);
    const suffix = Math.random().toString(36).slice(-6);
    const slug = `${baseSlug}-${suffix}`;

    const event = await prisma.event.create({
      data: {
        ...rest,
        // customType only makes sense for type "OTHER"
        customType: rest.type === 'OTHER' ? (customType?.trim() || null) : null,
        slug,
        startDate: new Date(rest.startDate),
        endDate: new Date(rest.endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxSlots: maxSlots ?? null,
        coverImage: coverImage || null,
        themeColor: themeColor || null,
        paymentAccountId: paymentAccountId || null,
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
        customType: true,
        venue: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        maxSlots: true,
        status: true,
        coverImage: true,
        themeColor: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        paymentAccount: {
          select: {
            id: true,
            method: true,
            label: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
            qrCodeUrl: true,
            instructions: true,
          },
        },
        organizations: {
          select: {
            id: true,
            orgId: true,
            role: true,
            inviteStatus: true,
            organization: { select: { name: true, logoUrl: true } },
          },
        },
        feeItems: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, amount: true, isRequired: true, order: true },
        },
        registrantTypes: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, order: true },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true, parentQuestionId: true, triggerOption: true,
            label: true, type: true, options: true, isRequired: true, order: true,
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
      questions: buildQuestionTree(event.questions),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const isPrismaUniqueError =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002';
    if (isPrismaUniqueError) {
      return NextResponse.json({ error: 'An event with this title already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
