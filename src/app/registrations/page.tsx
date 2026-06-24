import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveFilterOrgIds, orgIdWhereClause } from '@/lib/org-access';
import { eventOrgFilterWhere } from '@/lib/event-access';
import { RegistrationsClient } from '@/components/registration/RegistrationsClient';
import { buildQuestionTree } from '@/lib/eventQuestions';
import type { RegistrationListItem, EventListItem } from '@/types';

export const dynamic = 'force-dynamic';

export default async function RegistrationsPage() {
  const session = await getServerSession(authOptions);
  const filterOrgIds = session ? resolveFilterOrgIds(session) : [];
  const orgFilter = session ? orgIdWhereClause(session) : { orgId: { in: [] as string[] } };

  const rawRegs = await prisma.registration.findMany({
    where: orgFilter,
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

  const registrations: RegistrationListItem[] = rawRegs.map((r) => {
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

  // Fetch events for the event filter dropdown
  const rawEvents = await prisma.event.findMany({
    where: eventOrgFilterWhere(filterOrgIds),
    orderBy: { startDate: 'desc' },
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

  const events: EventListItem[] = rawEvents.map((e) => ({
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
      role: o.role as 'HOST' | 'COLLABORATOR',
      inviteStatus: o.inviteStatus as 'PENDING' | 'ACCEPTED' | 'DECLINED',
    })),
    questions: buildQuestionTree(e.questions),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Registrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and manage event registrations
        </p>
      </div>
      <RegistrationsClient
        initialData={registrations}
        events={events}
      />
    </div>
  );
}
