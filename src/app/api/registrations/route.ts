import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { orgIdWhereClause, OrgAccessError } from '@/lib/org-access';
import { registrationGroupSchema } from '@/validations/registration.schema';
import { randomBytes } from 'crypto';
import { sendRegistrationPendingEmail } from '@/lib/mail';
import { buildQuestionTree, resolveQuestionAnswers } from '@/lib/eventQuestions';

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

    const eventId = req.nextUrl.searchParams.get('eventId') ?? undefined;
    const status = req.nextUrl.searchParams.get('status') ?? undefined;
    const queryOrgId = req.nextUrl.searchParams.get('orgId') ?? undefined;

    const orgFilter = orgIdWhereClause(session, queryOrgId);

    const registrations = await prisma.registration.findMany({
      where: {
        ...orgFilter,
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
        registrantTypeId: true,
        registrantTypeLabel: true,
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
        feeItems: {
          select: { id: true, label: true, amount: true },
        },
        answers: {
          select: { questionLabel: true, answer: true },
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
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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
        customType: true,
        startDate: true,
        endDate: true,
        venue: true,
        status: true,
        maxSlots: true,
        registrationDeadline: true,
        feeItems: {
          select: { id: true, label: true, amount: true, isRequired: true },
        },
        registrantTypes: {
          select: { id: true, label: true },
        },
        questions: {
          select: {
            id: true, parentQuestionId: true, triggerOption: true,
            label: true, type: true, options: true, isRequired: true, order: true,
          },
        },
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

    // Required fee items are force-included and any id not belonging to this event is dropped —
    // the authoritative amount is always computed server-side, never trusted from the client.
    const requiredFeeItemIds = event.feeItems.filter((i) => i.isRequired).map((i) => i.id);
    const registrantFeeSelections = registrants.map((r) => {
      const validIds = (r.selectedFeeItemIds ?? []).filter((id) => event.feeItems.some((i) => i.id === id));
      const finalIds = Array.from(new Set([...validIds, ...requiredFeeItemIds]));
      const items = event.feeItems.filter((i) => finalIds.includes(i.id));
      const amount = items.reduce((sum, i) => sum + i.amount, 0);
      return { items, amount };
    });
    const totalAmount = registrantFeeSelections.reduce((sum, s) => sum + s.amount, 0);

    // Registrant type must belong to this event — any id that doesn't is silently dropped
    // rather than rejected outright, since the field is optional.
    const registrantTypeSnapshots = registrants.map((r) => {
      const match = r.registrantTypeId
        ? event.registrantTypes.find((t) => t.id === r.registrantTypeId)
        : undefined;
      return match ? { id: match.id, label: match.label } : null;
    });

    // Only answers on a currently-active branch (i.e. every ancestor's triggerOption matches
    // what was actually answered) are kept — a stale answer for a since-hidden follow-up is
    // dropped rather than rejected. Required questions still active with no matching answer
    // are rejected outright, since "Required" is an explicit admin setting.
    const questionTree = buildQuestionTree(event.questions);
    const answerResolutions = registrants.map((r) => resolveQuestionAnswers(questionTree, r.answers ?? {}));
    const answerSnapshots = answerResolutions.map((r) => r.snapshots);
    for (const { missingRequired } of answerResolutions) {
      if (missingRequired.length > 0) {
        return NextResponse.json(
          { error: `Please answer: ${missingRequired.map((q) => q.label).join(', ')}` },
          { status: 400 },
        );
      }
    }

    if (totalAmount > 0 && paymentIntent === 'ONLINE' && !payment) {
      return NextResponse.json({ error: 'Payment details are required' }, { status: 400 });
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
        resolvedRegistrants.map((registrant, i) =>
          tx.registration.create({
            data: {
              eventId,
              registrantId: registrant.id,
              groupId: group.id,
              orgId: hostOrgId,
              paymentIntent,
              status: 'PENDING',
              registrantTypeId: registrantTypeSnapshots[i]?.id ?? null,
              registrantTypeLabel: registrantTypeSnapshots[i]?.label ?? null,
            },
            select: { id: true, registrantId: true },
          }),
        ),
      );

      // Snapshot each registrant's selected fee items (label/amount frozen at submission time)
      await Promise.all(
        registrationRecords.map((reg, i) => {
          const { items } = registrantFeeSelections[i];
          if (items.length === 0) return Promise.resolve();
          return tx.registrationFeeItem.createMany({
            data: items.map((item) => ({
              registrationId: reg.id,
              feeItemId: item.id,
              label: item.label,
              amount: item.amount,
            })),
          });
        }),
      );

      // Snapshot each registrant's question answers (label frozen at submission time)
      await Promise.all(
        registrationRecords.map((reg, i) => {
          const answers = answerSnapshots[i];
          if (answers.length === 0) return Promise.resolve();
          return tx.registrationAnswer.createMany({
            data: answers.map((a) => ({
              registrationId: reg.id,
              questionId: a.questionId,
              questionLabel: a.questionLabel,
              answer: a.answer,
            })),
          });
        }),
      );

      // Create shared payment for group (server-computed total — never trust client amount)
      if (payment && totalAmount > 0) {
        await tx.payment.create({
          data: {
            amount: totalAmount,
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
      eventType: event.type === 'OTHER' ? (event.customType || 'Other') : event.type,
      eventStartDate: formatDate(event.startDate),
      eventEndDate: formatDate(event.endDate),
      eventVenue: event.venue ?? null,
      confirmationCode: result.confirmationCode,
      registrants: result.registrations.map((r, i) => ({
        fullName: r.fullName,
        email: r.email,
        feeItems: registrantFeeSelections[i].items.map((item) => ({ label: item.label, amount: item.amount })),
      })),
      headcount: result.headcount,
      paymentIntent,
      totalAmount,
    }).catch(console.error);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 });
  }
}
