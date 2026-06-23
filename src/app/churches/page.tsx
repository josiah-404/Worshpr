import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleOrgIds, isOfficer } from '@/lib/org-access';
import { ChurchesClient } from './ChurchesClient';
import type { Church, Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ChurchesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  if (isOfficer(session)) redirect('/');

  const isSuperAdmin = session.user.isSuperAdmin;
  const accessibleOrgIds = getAccessibleOrgIds(session);
  const activeOrgId = session.user.activeOrgId;

  if (!isSuperAdmin && (!accessibleOrgIds || accessibleOrgIds.length === 0)) redirect('/');

  const churchWhere = isSuperAdmin
    ? activeOrgId
      ? { orgId: activeOrgId }
      : undefined
    : accessibleOrgIds && accessibleOrgIds.length === 1
      ? { orgId: accessibleOrgIds[0] }
      : activeOrgId
        ? { orgId: activeOrgId }
        : { orgId: { in: accessibleOrgIds ?? [] } };

  const [rawChurches, rawOrgs] = await Promise.all([
    prisma.church.findMany({
      where: churchWhere,
      orderBy: [{ orgId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        orgId: true,
        name: true,
        location: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { name: true } },
      },
    }),
    isSuperAdmin
      ? prisma.organization.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
        })
      : prisma.organization.findMany({
          where: { id: { in: accessibleOrgIds ?? [] } },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
        }),
  ]);

  const initialChurches: Church[] = rawChurches.map((c) => ({
    id: c.id,
    orgId: c.orgId,
    orgName: c.organization.name,
    name: c.name,
    location: c.location,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const organizations: Organization[] = rawOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    logoUrl: o.logoUrl,
    isActive: o.isActive,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Churches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the churches under your organization
        </p>
      </div>
      <ChurchesClient
        ssrOrgId={activeOrgId ?? organizations[0]?.id ?? ''}
        initialChurches={initialChurches}
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
      />
    </div>
  );
}
