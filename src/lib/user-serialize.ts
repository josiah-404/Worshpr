import type { Prisma } from '@/generated/prisma';
import type { User } from '@/types';

const userSelect = {
  id: true,
  name: true,
  email: true,
  isSuperAdmin: true,
  createdAt: true,
  updatedAt: true,
  password: true,
  memberships: {
    select: {
      orgId: true,
      role: true,
      title: true,
      organization: { select: { name: true } },
    },
  },
} satisfies Prisma.UserSelect;

type RawUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export function serializeUser(user: RawUser): User {
  const { password, memberships, ...rest } = user;
  return {
    id: rest.id.toString(),
    name: rest.name,
    email: rest.email,
    isSuperAdmin: rest.isSuperAdmin,
    createdAt: rest.createdAt.toISOString(),
    isSetup: password !== null,
    memberships: memberships.map((m) => ({
      orgId: m.orgId,
      orgName: m.organization.name,
      role: m.role as 'org_admin' | 'officer',
      title: m.title,
    })),
  };
}

export { userSelect };
