import { prisma } from '@/lib/prisma';
import { UsersTable } from './UsersTable';
import type { User } from '@/types';
import type { User as PrismaUser } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const raw = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  const users: User[] = raw.map((u: PrismaUser) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as User['role'],
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-xl font-semibold'>User Management</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          Manage worship team members and their roles
        </p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  );
}
