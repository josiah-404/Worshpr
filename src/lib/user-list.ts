import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { serializeUser, userSelect } from '@/lib/user-serialize';
import type { PaginatedUsersResponse } from '@/types';

interface ListUsersParams {
  manageableOrgIds: string[] | null;
  page: number;
  pageSize: number;
  query: string;
}

function buildUserWhere(
  manageableOrgIds: string[] | null,
  query: string,
): Prisma.UserWhereInput {
  const baseWhere: Prisma.UserWhereInput = manageableOrgIds
    ? {
        isSuperAdmin: false,
        memberships: {
          some: { orgId: { in: manageableOrgIds } },
        },
      }
    : {};

  if (!query.trim()) {
    return baseWhere;
  }

  const searchFilter: Prisma.UserWhereInput = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (Object.keys(baseWhere).length === 0) {
    return searchFilter;
  }

  return { AND: [baseWhere, searchFilter] };
}

export async function listUsers({
  manageableOrgIds,
  page,
  pageSize,
  query,
}: ListUsersParams): Promise<PaginatedUsersResponse> {
  const where = buildUserWhere(manageableOrgIds, query);
  const skip = (page - 1) * pageSize;

  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: rawUsers.map(serializeUser),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
