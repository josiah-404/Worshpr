import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentAccountsClient } from './PaymentAccountsClient';
import type { PaymentAccount } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PaymentAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { role, orgId } = session.user;

  if (!orgId && role !== 'super_admin') redirect('/');

  const raw = orgId
    ? await prisma.paymentAccount.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orgId: true,
          method: true,
          label: true,
          accountName: true,
          accountNumber: true,
          bankName: true,
          qrCodeUrl: true,
          instructions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  const initialAccounts: PaymentAccount[] = raw.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payment Accounts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage accounts where event registrants will send their payments
        </p>
      </div>
      <PaymentAccountsClient
        orgId={orgId ?? ''}
        initialAccounts={initialAccounts}
      />
    </div>
  );
}
