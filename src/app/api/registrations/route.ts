import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registrationGroupSchema } from '@/validations/registration.schema';
import { randomBytes } from 'crypto';
import { sendRegistrationPendingEmail } from '@/lib/mail';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `REG-${code.slice(0, 4)}-${code.slice(4)}`;
}

// ─── GET (admin) ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, orgId } = session.user;
    const eventId = req.nextUrl.searchParams.get('eventId') ?? undefined;
    const status = req.nextUrl.searchParams.get('status') ?? undefined;
    const queryOrgId = req.nextUrl.searchParams.get('orgId') ?? undefined;

    // super_admin can query by any orgId; others are locked to their own org
    const filterOrgId = role === 'super_admin' ? queryOrgId : (orgId ?? undefined);

    const registrations = await prisma.registration.findMany({
      where: {
        ...(filterOrgId ? { orgId: filterOrgId } : {}),
        ...(eventId ? { eventId } : {}),
        ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        eventId: true,
        orgId: true,
        status: true,
        paymentIntent: true,
        approvedBy: true,
        approvedAt: true,
        rejectedBy: true,
        rejectedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        registrant: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            email: true,
            phone: true,
            birthday: true,
            address: true,
            photoUrl: true,
            churchId: true,
            churchRef: { select: { name: true } },
            divisionOrgId: true,
            divisionOrg: { select: { name: true } },
            emergencyContactName: true,
            emergencyContactPhone: true,
          },
        },
        group: {
          select: {
            id: true,
            confirmationCode: true,
            submittedByName: true,
            submittedByEmail: true,
            headcount: true,
            createdAt: true,
            sharedPayment: {
              select: {
                id: true,
                amount: true,
                method: true,
                receiptUrl: true,
                referenceNo: true,
                status: true,
                verifiedBy: true,
                verifiedAt: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            receiptUrl: true,
            referenceNo: true,
            status: true,
            verifiedBy: true,
            verifiedAt: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    const data = registrations.map((r) => {
      // Use individual payment if set, otherwise fall back to the group's shared payment
      const effectivePayment = r.payment ?? r.group.sharedPayment ?? null;
      const { sharedPayment: _sp, ...groupRest } = r.group;

      return {
        ...r,
        approvedAt: r.approvedAt?.toISOString() ?? null,
        rejectedAt: r.rejectedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        registrant: {
          ...r.registrant,
          birthday: r.registrant.birthday.toISOString(),
          churchName: r.registrant.churchRef?.name ?? null,
          divisionOrgName: r.registrant.divisionOrg?.name ?? null,
        },
        group: {
          ...groupRest,
          createdAt: r.group.createdAt.toISOString(),
        },
        payment: effectivePayment
          ? {
              ...effectivePayment,
              verifiedAt: effectivePayment.verifiedAt?.toISOString() ?? null,
              createdAt: effectivePayment.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

// ─── POST (public) ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registrationGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventId, submittedByName, submittedByEmail, registrants, paymentIntent, payment } =
      parsed.data;

    // Fetch event to validate it exists, is OPEN, and has available slots
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        venue: true,
        status: true,
        maxSlots: true,
        registrationDeadline: true,
        fee: true,
        organizations: {
          where: { role: 'HOST', inviteStatus: 'ACCEPTED' },
          select: { orgId: true },
          take: 1,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (event.status !== 'OPEN') {
      return NextResponse.json({ error: 'Registration is not open for this event' }, { status: 400 });
    }
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    if (event.maxSlots !== null) {
      const approvedCount = await prisma.registration.count({
        where: { eventId, status: 'APPROVED' },
      });
      const remaining = event.maxSlots - approvedCount;
      if (registrants.length > remaining) {
        return NextResponse.json(
          { error: `Only ${remaining} slot(s) remaining` },
          { status: 400 },
        );
      }
    }

    const hostOrgId = event.organizations[0]?.orgId;
    if (!hostOrgId) {
      return NextResponse.json({ error: 'Event has no host organization' }, { status: 500 });
    }

    const confirmationCode = generateConfirmationCode();

    const result = await prisma.$transaction(async (tx) => {
      // Upsert registrant records by email — always update with the latest submitted data
      const resolvedRegistrants = await Promise.all(
        registrants.map((r) =>
          tx.registrant.upsert({
            where: { email: r.email },
            create: {
              fullName: r.fullName,
              nickname: r.nickname?.trim() || null,
              email: r.email,
              phone: r.phone,
              birthday: new Date(r.birthday),
              address: r.address,
              photoUrl: r.photoUrl || null,
              churchId: r.churchId || null,
              divisionOrgId: r.divisionOrgId || null,
              emergencyContactName: r.emergencyContactName,
              emergencyContactPhone: r.emergencyContactPhone,
            },
            update: {
              fullName: r.fullName,
              nickname: r.nickname?.trim() || null,
              phone: r.phone,
              birthday: new Date(r.birthday),
              address: r.address,
              photoUrl: r.photoUrl || null,
              churchId: r.churchId || null,
              divisionOrgId: r.divisionOrgId || null,
              emergencyContactName: r.emergencyContactName,
              emergencyContactPhone: r.emergencyContactPhone,
            },
          }),
        ),
      );

      // Check for duplicate registrations by registrantId (email-based)
      const existingRegs = await tx.registration.findMany({
        where: {
          eventId,
          registrantId: { in: resolvedRegistrants.map((r) => r.id) },
        },
        select: { registrantId: true },
      });

      if (existingRegs.length > 0) {
        const dupeIds = new Set(existingRegs.map((r) => r.registrantId));
        const dupeNames = resolvedRegistrants
          .filter((r) => dupeIds.has(r.id))
          .map((r) => r.fullName)
          .join(', ');
        throw new Error(`Already registered: ${dupeNames}`);
      }

      // Check for duplicate registrations by fullName + birthday + divisionOrgId (per event)
      for (const r of registrants) {
        const normalizedDivisionOrgId = r.divisionOrgId || null;
        const duplicate = await tx.registration.findFirst({
          where: {
            eventId,
            registrant: {
              fullName: { equals: r.fullName.trim(), mode: 'insensitive' },
              birthday: new Date(r.birthday),
              divisionOrgId: normalizedDivisionOrgId,
            },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new Error(
            `${r.fullName} is already registered for this event.`,
          );
        }
      }

      // Create registration group
      const group = await tx.registrationGroup.create({
        data: {
          eventId,
          confirmationCode,
          submittedByName,
          submittedByEmail,
          headcount: registrants.length,
        },
      });

      // Create registrations
      const registrationRecords = await Promise.all(
        resolvedRegistrants.map((registrant) =>
          tx.registration.create({
            data: {
              eventId,
              registrantId: registrant.id,
              groupId: group.id,
              orgId: hostOrgId,
              paymentIntent,
              status: 'PENDING',
            },
            select: { id: true, registrantId: true },
          }),
        ),
      );

      // Create shared payment for group (if provided and fee > 0)
      if (payment && event.fee > 0) {
        await tx.payment.create({
          data: {
            amount: payment.amount,
            method: payment.method,
            receiptUrl: payment.receiptUrl ?? null,
            referenceNo: payment.referenceNo ?? null,
            status: 'PENDING',
            groupId: group.id,
          },
        });
      }

      return {
        confirmationCode: group.confirmationCode,
        headcount: group.headcount,
        registrations: registrationRecords.map((reg, i) => ({
          id: reg.id,
          registrantId: reg.registrantId,
          fullName: resolvedRegistrants[i].fullName,
          email: resolvedRegistrants[i].email,
        })),
      };
    });

    sendRegistrationPendingEmail({
      to: submittedByEmail,
      submittedByName,
      eventTitle: event.title,
      eventType: event.type,
      eventStartDate: formatDate(event.startDate),
      eventEndDate: formatDate(event.endDate),
      eventVenue: event.venue ?? null,
      confirmationCode: result.confirmationCode,
      registrants: result.registrations.map((r) => ({ fullName: r.fullName, email: r.email })),
      headcount: result.headcount,
      paymentIntent,
      eventFee: event.fee,
    }).catch(console.error);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 });
  }
}
