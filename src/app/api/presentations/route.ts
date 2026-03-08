import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPresentationSchema } from '@/validations/presentation.schema';

export async function GET() {
  try {
    const presentations = await prisma.presentation.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const serialized = presentations.map((p) => ({ ...p, id: p.id.toString() }));
    return NextResponse.json({ data: serialized }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch presentations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPresentationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const presentation = await prisma.presentation.create({
      data: {
        title: parsed.data.title.trim(),
        lyrics: parsed.data.lyrics,
        songQueue: parsed.data.songQueue,
        bgId: parsed.data.bgId,
        transitionId: parsed.data.transitionId,
        fontId: parsed.data.fontId,
        sizeId: parsed.data.sizeId,
      },
    });

    return NextResponse.json({ data: { ...presentation, id: presentation.id.toString() } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create presentation' }, { status: 500 });
  }
}
