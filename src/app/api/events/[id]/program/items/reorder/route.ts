import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reorderItemsSchema } from '@/validations/program.schema';

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = reorderItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.$transaction(
      parsed.data.items.map(({ id, order }) =>
        prisma.programItem.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    return NextResponse.json({ data: { message: 'Reordered' } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 });
  }
}
