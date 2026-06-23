import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getManageableOrgIds } from '@/lib/org-access';
import { serializeUser, userSelect } from '@/lib/user-serialize';
import { UsersTable } from './UsersTable';
import type { User, Organization } from '@/types';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const manageableOrgIds = session ? getManageableOrgIds(session) : [];

  const userWhere = manageableOrgIds
    ? {
        isSuperAdmin: false,
        memberships: {
          some: { orgId: { in: manageableOrgIds } },
        },
      }
    : undefined;

  const orgWhere = manageableOrgIds
    ? { isActive: true, id: { in: manageableOrgIds } }
    : { isActive: true };

  const [rawUsers, rawOrgs] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    }),
    prisma.organization.findMany({
      where: orgWhere,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const users: User[] = rawUsers.map(serializeUser);

  const organizations: Organization[] = rawOrgs.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  const actorIsSuperAdmin = session?.user?.isSuperAdmin ?? false;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-xl font-semibold'>User Management</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          Manage worship team members and their roles
        </p>
      </div>
      <UsersTable
        initialUsers={users}
        organizations={organizations}
        actorIsSuperAdmin={actorIsSuperAdmin}
      />
    </div>
  );
}
