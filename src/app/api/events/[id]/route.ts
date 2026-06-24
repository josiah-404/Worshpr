import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEventHostAccess } from '@/lib/event-access';
import { OrgAccessError } from '@/lib/org-access';
import { updateEventSchema } from '@/validations/event.schema';
import { buildQuestionTree } from '@/lib/eventQuestions';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { coverImage, themeColor, paymentAccountId, registrationDeadline, maxSlots, startDate, endDate, customType, ...rest } =
      parsed.data;

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...rest,
        // customType only makes sense for type "OTHER" — clear it whenever the type changes away
        ...(rest.type !== undefined
          ? { customType: rest.type === 'OTHER' ? (customType?.trim() || null) : null }
          : customType !== undefined
            ? { customType: customType.trim() || null }
            : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(registrationDeadline !== undefined
          ? { registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null }
          : {}),
        ...(maxSlots !== undefined ? { maxSlots: maxSlots ?? null } : {}),
        ...(coverImage !== undefined ? { coverImage: coverImage || null } : {}),
        ...(themeColor !== undefined ? { themeColor: themeColor || null } : {}),
        ...(paymentAccountId !== undefined
          ? { paymentAccountId: paymentAccountId || null }
          : {}),
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
      ...updated,
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate.toISOString(),
      registrationDeadline: updated.registrationDeadline?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      organizations: updated.organizations.map((o) => ({
        id: o.id,
        orgId: o.orgId,
        orgName: o.organization.name,
        orgLogoUrl: o.organization.logoUrl,
        role: o.role,
        inviteStatus: o.inviteStatus,
      })),
      questions: buildQuestionTree(updated.questions),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { message: 'Event deleted' } }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
