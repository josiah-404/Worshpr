import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import type { Church, PaginatedChurchesResponse } from '@/types/church.types';

const churchSelect = {
  id: true,
  orgId: true,
  name: true,
  location: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  organization: { select: { name: true } },
} satisfies Prisma.ChurchSelect;

type RawChurch = Prisma.ChurchGetPayload<{ select: typeof churchSelect }>;

function serializeChurch(church: RawChurch): Church {
  return {
    id: church.id,
    orgId: church.orgId,
    orgName: church.organization.name,
    name: church.name,
    location: church.location,
    isActive: church.isActive,
    createdAt: church.createdAt.toISOString(),
    updatedAt: church.updatedAt.toISOString(),
  };
}

interface ListChurchesParams {
  orgFilter: Prisma.ChurchWhereInput | undefined;
  page: number;
  pageSize: number;
  query: string;
  status: 'all' | 'active' | 'inactive';
}

function buildChurchWhere(
  orgFilter: Prisma.ChurchWhereInput | undefined,
  query: string,
  status: 'all' | 'active' | 'inactive',
): Prisma.ChurchWhereInput {
  const filters: Prisma.ChurchWhereInput[] = [];

  if (orgFilter) {
    filters.push(orgFilter);
  }

  if (status === 'active') {
    filters.push({ isActive: true });
  } else if (status === 'inactive') {
    filters.push({ isActive: false });
  }

  if (query.trim()) {
    filters.push({
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.length === 0) {
    return {};
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return { AND: filters };
}

export async function listChurches({
  orgFilter,
  page,
  pageSize,
  query,
  status,
}: ListChurchesParams): Promise<PaginatedChurchesResponse> {
  const where = buildChurchWhere(orgFilter, query, status);
  const skip = (page - 1) * pageSize;

  const [rawChurches, total] = await Promise.all([
    prisma.church.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
      select: churchSelect,
    }),
    prisma.church.count({ where }),
  ]);

  return {
    data: rawChurches.map(serializeChurch),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getAllChurches(
  orgFilter: Prisma.ChurchWhereInput | undefined,
): Promise<Church[]> {
  const churches = await prisma.church.findMany({
    where: orgFilter,
    orderBy: [{ orgId: 'asc' }, { name: 'asc' }],
    select: churchSelect,
  });

  return churches.map(serializeChurch);
}
