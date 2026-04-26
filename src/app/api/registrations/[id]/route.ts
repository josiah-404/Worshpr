import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } from '@/lib/mail';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    // Verify the registration belongs to the user's org (unless super_admin)
    const existing = await prisma.registration.findUnique({
      where: { id },
      select: { id: true, orgId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    if (session.user.role !== 'super_admin' && existing.orgId !== session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    const [updated] = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.update({
        where: { id },
        data: {
          status,
          notes: notes ?? null,
          ...(status === 'APPROVED'
            ? { approvedBy: session.user.id, approvedAt: now, rejectedBy: null, rejectedAt: null }
            : status === 'REJECTED'
              ? { rejectedBy: session.user.id, rejectedAt: now, approvedBy: null, approvedAt: null }
              : {}),
        },
        select: {
          id: true,
          status: true,
          approvedBy: true,
          approvedAt: true,
          rejectedBy: true,
          rejectedAt: true,
          notes: true,
          updatedAt: true,
          eventId: true,
          orgId: true,
          paymentIntent: true,
          registrant: { select: { fullName: true, email: true } },
          event: { select: { title: true, type: true, startDate: true, endDate: true, venue: true, fee: true } },
          payment: { select: { id: true, amount: true } },
          group: {
            select: {
              confirmationCode: true,
              sharedPayment: { select: { id: true, amount: true } },
            },
          },
        },
      });

      // Auto-insert finance ledger entry when a registration is approved with payment
      if (status === 'APPROVED') {
        const payment = reg.payment ?? reg.group.sharedPayment;
        if (payment && payment.amount > 0) {
          // Only insert if not already recorded (idempotency check)
          const alreadyRecorded = await tx.financeLedger.findFirst({
            where: { referenceId: payment.id },
          });
          if (!alreadyRecorded) {
            await tx.financeLedger.create({
              data: {
                orgId: reg.orgId,
                eventId: reg.eventId,
                type: 'INCOME',
                category: 'REGISTRATION',
                amount: payment.amount,
                description: `Registration — ${reg.registrant.fullName}`,
                referenceId: payment.id,
                enteredBy: session.user.id,
                date: now,
              },
            });
          }
        }
      }

      return [reg];
    });

    if (status === 'APPROVED') {
      sendRegistrationApprovedEmail({
        to: updated.registrant.email,
        registrantName: updated.registrant.fullName,
        eventTitle: updated.event.title,
        eventType: updated.event.type,
        eventStartDate: formatDate(updated.event.startDate),
        eventEndDate: formatDate(updated.event.endDate),
        eventVenue: updated.event.venue ?? null,
        confirmationCode: updated.group.confirmationCode,
        paymentIntent: updated.paymentIntent,
        eventFee: updated.event.fee,
        notes: updated.notes ?? null,
      }).catch(console.error);
    }

    if (status === 'REJECTED') {
      sendRegistrationRejectedEmail({
        to: updated.registrant.email,
        registrantName: updated.registrant.fullName,
        eventTitle: updated.event.title,
        eventType: updated.event.type,
        eventStartDate: formatDate(updated.event.startDate),
        eventEndDate: formatDate(updated.event.endDate),
        eventVenue: updated.event.venue ?? null,
        confirmationCode: updated.group.confirmationCode,
        reason: updated.notes ?? null,
      }).catch(console.error);
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        approvedBy: updated.approvedBy,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
        rejectedBy: updated.rejectedBy,
        rejectedAt: updated.rejectedAt?.toISOString() ?? null,
        notes: updated.notes,
        updatedAt: updated.updatedAt.toISOString(),
      },
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
