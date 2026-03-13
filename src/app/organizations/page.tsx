import { prisma } from '@/lib/prisma';
import { OrganizationsTable } from './OrganizationsTable';
import type { OrganizationRow } from '@/types';

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const raw = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { users: true } },
    },
  });

  const organizations = raw.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  })) as OrganizationRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organizations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage church organizations and their members
        </p>
      </div>
      <OrganizationsTable initialOrgs={organizations} />
    </div>
  );
}
