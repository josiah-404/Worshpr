import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idTemplateSchema } from '@/validations/id.schema';

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: eventId } = await params;
    const template = await prisma.eventIdTemplate.findUnique({ where: { eventId } });

    return NextResponse.json({ data: template ?? null }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT (upsert) ────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role === 'officer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const parsed = idTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { backgroundUrl, sizeId, layoutId, layoutFields, overlayColor, textColor, fontFamily } = parsed.data;

    const template = await prisma.eventIdTemplate.upsert({
      where: { eventId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { eventId, backgroundUrl, sizeId, layoutId, layoutFields: layoutFields as any, overlayColor, textColor, fontFamily },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { backgroundUrl, sizeId, layoutId, layoutFields: layoutFields as any, overlayColor, textColor, fontFamily },
    });

    return NextResponse.json({ data: template }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
