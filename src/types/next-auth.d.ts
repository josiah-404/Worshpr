import { DefaultSession } from 'next-auth';
import type { OrgMembership } from '@/types/org.types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isSuperAdmin: boolean;
      orgMemberships: OrgMembership[];
      activeOrgId: string | null;
      activeRole: OrgMembership['role'] | 'super_admin' | null;
      activeTitle: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    isSuperAdmin: boolean;
    orgMemberships: OrgMembership[];
    activeOrgId: string | null;
    activeRole: OrgMembership['role'] | 'super_admin' | null;
    activeTitle: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isSuperAdmin: boolean;
    orgMemberships: OrgMembership[];
    activeOrgId: string | null;
    activeRole: OrgMembership['role'] | 'super_admin' | null;
    activeTitle: string | null;
  }
}
