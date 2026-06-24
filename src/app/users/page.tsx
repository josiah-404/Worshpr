import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getManageableOrgIds } from '@/lib/org-access';
import { UsersTable } from './UsersTable';
import type { Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const manageableOrgIds = session ? getManageableOrgIds(session) : [];

  const orgWhere = manageableOrgIds
    ? { isActive: true, id: { in: manageableOrgIds } }
    : { isActive: true };

  const rawOrgs = await prisma.organization.findMany({
    where: orgWhere,
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
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  const actorIsSuperAdmin = session?.user?.isSuperAdmin ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage worship team members and their roles
        </p>
      </div>
      <UsersTable organizations={organizations} actorIsSuperAdmin={actorIsSuperAdmin} />
    </div>
  );
}
