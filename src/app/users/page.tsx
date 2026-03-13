import { prisma } from '@/lib/prisma';
import { UsersTable } from './UsersTable';
import type { User, Organization } from '@/types';
import type { User as PrismaUser } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const [rawUsers, rawOrgs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true, isActive: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const users: User[] = rawUsers.map((u: PrismaUser) => ({
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    role: u.role as User['role'],
    orgId: u.orgId ?? null,
    title: u.title ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  const organizations: Organization[] = rawOrgs.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-xl font-semibold'>User Management</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          Manage worship team members and their roles
        </p>
      </div>
      <UsersTable initialUsers={users} organizations={organizations} />
    </div>
  );
}
