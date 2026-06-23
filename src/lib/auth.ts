import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { buildSessionOrgFields, mapDbMemberships } from '@/lib/session-org';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              select: { orgId: true, role: true, title: true },
            },
          },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        const memberships = mapDbMemberships(user.memberships);
        const orgFields = buildSessionOrgFields(user.isSuperAdmin, memberships);

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          ...orgFields,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = user.isSuperAdmin;
        token.orgMemberships = user.orgMemberships;
        token.activeOrgId = user.activeOrgId;
        token.activeRole = user.activeRole;
        token.activeTitle = user.activeTitle;
      }

      if (trigger === 'update' && session?.activeOrgId !== undefined) {
        const memberships = token.orgMemberships ?? [];
        const isSuperAdmin = token.isSuperAdmin ?? false;
        const orgFields = buildSessionOrgFields(
          isSuperAdmin,
          memberships,
          session.activeOrgId as string | null,
        );
        token.activeOrgId = orgFields.activeOrgId;
        token.activeRole = orgFields.activeRole;
        token.activeTitle = orgFields.activeTitle;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isSuperAdmin = token.isSuperAdmin ?? false;
        session.user.orgMemberships = token.orgMemberships ?? [];
        session.user.activeOrgId = token.activeOrgId ?? null;
        session.user.activeRole = token.activeRole ?? null;
        session.user.activeTitle = token.activeTitle ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
