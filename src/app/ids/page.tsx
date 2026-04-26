import { IdCard } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { IdsEventGrid } from './IdsEventGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ID Generator — EMBR' };

export default async function IdsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { role, orgId } = session.user;

  const events = await prisma.event.findMany({
    where: role === 'super_admin' ? {} : { organizations: { some: { orgId: orgId ?? '', inviteStatus: 'ACCEPTED' } } },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      startDate: true,
      endDate: true,
      status: true,
      coverImage: true,
      idTemplate: { select: { id: true } },
      _count: {
        select: {
          registrations: { where: { status: 'APPROVED' } },
        },
      },
    },
  });

  const mapped = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    status: e.status,
    coverImage: e.coverImage,
    hasTemplate: !!e.idTemplate,
    approvedCount: e._count.registrations,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <IdCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">ID Generator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Design and export event IDs for approved registrants
          </p>
        </div>
      </div>

      <IdsEventGrid events={mapped} />
    </div>
  );
}
