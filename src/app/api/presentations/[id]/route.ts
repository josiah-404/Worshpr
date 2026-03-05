import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePresentationSchema } from '@/validations/presentation.schema';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { id: params.id },
    });

    if (!presentation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: presentation }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch presentation' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updatePresentationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data.title
      ? { ...parsed.data, title: parsed.data.title.trim() }
      : parsed.data;

    const presentation = await prisma.presentation.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ data: presentation }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update presentation' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.presentation.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { success: true } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete presentation' }, { status: 500 });
  }
}
