import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { buildQuestionTree, resolveQuestionAnswers } from '@/lib/eventQuestions';

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `REG-${code.slice(0, 4)}-${code.slice(4)}`;
}

const walkInSchema = z.object({
  eventId:               z.string().min(1),
  fullName:              z.string().min(1, 'Full name is required'),
  email:                 z.string().email('Invalid email'),
  phone:                 z.string().min(1, 'Phone is required'),
  birthday:              z.string().min(1, 'Birthday is required'),
  nickname:              z.string().optional(),
  address:               z.string().optional(),
  emergencyContactName:  z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  churchId:              z.string().optional(),
  divisionOrgId:         z.string().optional(),
  paymentIntent:         z.enum(['CASH', 'ONLINE', 'FREE']).default('CASH'),
  selectedFeeItemIds:    z.array(z.string()).default([]),
  answers:               z.record(z.string(), z.string()).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = walkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const {
      eventId, fullName, email, phone, birthday,
      nickname, address, emergencyContactName, emergencyContactPhone,
      churchId, divisionOrgId, paymentIntent, selectedFeeItemIds, answers,
    } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        feeItems: {
          select: { id: true, label: true, amount: true, isRequired: true },
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

    const hostOrgId = event.organizations[0]?.orgId;
    if (!hostOrgId) {
      return NextResponse.json({ error: 'Event has no host organization' }, { status: 500 });
    }

    // Required fee items are force-included and any id not belonging to this event is dropped —
    // same integrity rule as the public registration endpoint.
    const requiredFeeItemIds = event.feeItems.filter((i) => i.isRequired).map((i) => i.id);
    const validIds = selectedFeeItemIds.filter((id) => event.feeItems.some((i) => i.id === id));
    const finalFeeItemIds = Array.from(new Set([...validIds, ...requiredFeeItemIds]));
    const selectedItems = event.feeItems.filter((i) => finalFeeItemIds.includes(i.id));
    const totalAmount = selectedItems.reduce((sum, i) => sum + i.amount, 0);

    // Only answers on a currently-active branch are kept — required questions still active
    // with no matching answer are rejected outright, since "Required" is an explicit admin
    // setting. See resolveQuestionAnswers for the active-branch tree walk.
    const { snapshots: answerSnapshots, missingRequired } = resolveQuestionAnswers(
      buildQuestionTree(event.questions),
      answers,
    );
    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: `Please answer: ${missingRequired.map((q) => q.label).join(', ')}` },
        { status: 400 },
      );
    }

    const confirmationCode = generateConfirmationCode();
    const submittedByName = session.user.name ?? session.user.email ?? 'Admin';
    const submittedByEmail = session.user.email ?? '';

    const result = await prisma.$transaction(async (tx) => {
      const registrant = await tx.registrant.upsert({
        where: { email },
        create: {
          fullName,
          nickname:             nickname?.trim()             || null,
          email,
          phone,
          birthday:             new Date(birthday),
          address:              address                      || '',
          churchId:             churchId                     || null,
          divisionOrgId:        divisionOrgId                || null,
          emergencyContactName: emergencyContactName         || '',
          emergencyContactPhone:emergencyContactPhone        || '',
        },
        update: {
          fullName,
          nickname:             nickname?.trim()             || null,
          phone,
          birthday:             new Date(birthday),
          address:              address                      || '',
          churchId:             churchId                     || null,
          divisionOrgId:        divisionOrgId                || null,
          emergencyContactName: emergencyContactName         || '',
          emergencyContactPhone:emergencyContactPhone        || '',
        },
      });

      // Email-based duplicate check
      const existingReg = await tx.registration.findFirst({
        where: { eventId, registrantId: registrant.id },
        select: { id: true },
      });
      if (existingReg) {
        throw new Error(`${fullName} is already registered for this event.`);
      }

      // Identity-based duplicate check (name + birthday + division)
      const identityDupe = await tx.registration.findFirst({
        where: {
          eventId,
          registrant: {
            fullName:      { equals: fullName.trim(), mode: 'insensitive' },
            birthday:      new Date(birthday),
            divisionOrgId: divisionOrgId || null,
          },
        },
        select: { id: true },
      });
      if (identityDupe) {
        throw new Error(`${fullName} is already registered for this event.`);
      }

      const group = await tx.registrationGroup.create({
        data: {
          eventId,
          confirmationCode,
          submittedByName,
          submittedByEmail,
          headcount: 1,
        },
      });

      const registration = await tx.registration.create({
        data: {
          eventId,
          registrantId: registrant.id,
          groupId:      group.id,
          orgId:        hostOrgId,
          paymentIntent,
          status:       'APPROVED',
          approvedBy:   session.user.id,
          approvedAt:   new Date(),
        },
      });

      if (selectedItems.length > 0) {
        await tx.registrationFeeItem.createMany({
          data: selectedItems.map((item) => ({
            registrationId: registration.id,
            feeItemId: item.id,
            label: item.label,
            amount: item.amount,
          })),
        });
      }

      if (answerSnapshots.length > 0) {
        await tx.registrationAnswer.createMany({
          data: answerSnapshots.map((a) => ({
            registrationId: registration.id,
            questionId: a.questionId,
            questionLabel: a.questionLabel,
            answer: a.answer,
          })),
        });
      }

      // Walk-ins are entered (and confirmed) by staff on the spot — record the payment as
      // already verified and post the income immediately, mirroring the auto-insert that
      // happens on approval for the public registration flow.
      if (totalAmount > 0) {
        const payment = await tx.payment.create({
          data: {
            amount: totalAmount,
            method: paymentIntent === 'ONLINE' ? 'OTHER' : 'CASH',
            status: 'VERIFIED',
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
            registrationId: registration.id,
          },
        });

        await tx.financeLedger.create({
          data: {
            orgId: hostOrgId,
            eventId,
            type: 'INCOME',
            category: 'REGISTRATION',
            amount: payment.amount,
            description: `Registration — ${fullName}`,
            referenceId: payment.id,
            enteredBy: session.user.id,
            date: new Date(),
          },
        });
      }

      return { confirmationCode, fullName, email };
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add registrant' }, { status: 500 });
  }
}
