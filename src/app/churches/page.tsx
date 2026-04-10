import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChurchesClient } from './ChurchesClient';
import type { Church, Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ChurchesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { role, orgId } = session.user;
  if (role === 'officer') redirect('/');
  if (!orgId && role !== 'super_admin') redirect('/');

  const isSuperAdmin = role === 'super_admin';

  const [rawChurches, rawOrgs] = await Promise.all([
    prisma.church.findMany({
      where: orgId ? { orgId } : undefined,
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
      : [],
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
        ssrOrgId={orgId ?? ''}
        initialChurches={initialChurches}
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
      />
    </div>
  );
}
