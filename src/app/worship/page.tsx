import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { PresentationsTable } from './PresentationsTable';
import type { Presentation } from '@/types';
import type { Presentation as PrismaPresentation } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export default async function WorshipPage() {
  const raw = await prisma.presentation.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  const presentations: Presentation[] = raw.map((p: PrismaPresentation) => ({
    id: p.id.toString(),
    title: p.title,
    lyrics: p.lyrics,
    songQueue: [],
    bgId: p.bgId,
    transitionId: p.transitionId,
    fontId: p.fontId,
    sizeId: p.sizeId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>Worship Screen</h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Manage your presentation setlists
          </p>
        </div>
        <Link href='/worship/editor'>
          <Button className='bg-indigo-500 hover:bg-indigo-600 text-white'>
            <Plus className='mr-2 h-4 w-4' />
            New Presentation
          </Button>
        </Link>
      </div>

      <PresentationsTable presentations={presentations} />
    </div>
  );
}
