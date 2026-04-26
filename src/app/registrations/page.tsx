import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RegistrationsClient } from '@/components/registration/RegistrationsClient';
import type { RegistrationListItem, EventListItem, OrgRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function RegistrationsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role ?? 'officer') as OrgRole;
  const userOrgId = session?.user?.orgId ?? null;

  const isSuperAdmin = role === 'super_admin';

  // Fetch registrations
  const rawRegs = await prisma.registration.findMany({
    where: isSuperAdmin
      ? undefined
      : userOrgId
        ? { orgId: userOrgId }
        : { id: 'none' },
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
    where: isSuperAdmin
      ? undefined
      : userOrgId
        ? { organizations: { some: { orgId: userOrgId } } }
        : { id: 'none' },
    orderBy: { startDate: 'desc' },
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
