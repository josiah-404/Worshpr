import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleOrgIds, isOfficer } from '@/lib/org-access';
import { ChurchesTable } from './ChurchesTable';
import type { Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ChurchesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  if (isOfficer(session)) redirect('/');

  const isSuperAdmin = session.user.isSuperAdmin;
  const accessibleOrgIds = getAccessibleOrgIds(session);
  const activeOrgId = session.user.activeOrgId;

  if (!isSuperAdmin && (!accessibleOrgIds || accessibleOrgIds.length === 0)) redirect('/');

  const rawOrgs = isSuperAdmin
    ? await prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : await prisma.organization.findMany({
        where: { id: { in: accessibleOrgIds ?? [] } },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

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
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage the churches under your organization
        </p>
      </div>
      <ChurchesTable
        ssrOrgId={activeOrgId ?? organizations[0]?.id ?? ''}
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
      />
    </div>
  );
}
