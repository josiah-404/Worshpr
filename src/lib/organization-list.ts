import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import type { OrganizationRow, PaginatedOrganizationsResponse } from '@/types';

const orgSelect = {
  id: true,
  name: true,
  logoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { memberships: true } },
} satisfies Prisma.OrganizationSelect;

interface ListOrganizationsParams {
  accessibleOrgIds: string[] | null;
  page: number;
  pageSize: number;
  query: string;
}

function buildOrganizationWhere(
  accessibleOrgIds: string[] | null,
  query: string,
): Prisma.OrganizationWhereInput {
  const baseWhere: Prisma.OrganizationWhereInput = accessibleOrgIds
    ? { id: { in: accessibleOrgIds } }
    : {};

  if (!query.trim()) {
    return baseWhere;
  }

  const searchFilter: Prisma.OrganizationWhereInput = {
    name: { contains: query, mode: 'insensitive' },
  };

  if (Object.keys(baseWhere).length === 0) {
    return searchFilter;
  }

  return { AND: [baseWhere, searchFilter] };
}

function serializeOrganizationRow(
  org: Prisma.OrganizationGetPayload<{ select: typeof orgSelect }>,
): OrganizationRow {
  return {
    id: org.id,
    name: org.name,
    logoUrl: org.logoUrl,
    isActive: org.isActive,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    _count: org._count,
  };
}

export async function listOrganizations({
  accessibleOrgIds,
  page,
  pageSize,
  query,
}: ListOrganizationsParams): Promise<PaginatedOrganizationsResponse> {
  const where = buildOrganizationWhere(accessibleOrgIds, query);
  const skip = (page - 1) * pageSize;

  const [rawOrgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: orgSelect,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    data: rawOrgs.map(serializeOrganizationRow),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getAllOrganizations(
  accessibleOrgIds: string[] | null,
): Promise<OrganizationRow[]> {
  const where = accessibleOrgIds ? { id: { in: accessibleOrgIds } } : undefined;

  const rawOrgs = await prisma.organization.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: orgSelect,
  });

  return rawOrgs.map(serializeOrganizationRow);
}
