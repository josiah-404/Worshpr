import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const presentation = await prisma.presentation.findUnique({
    where: { id: params.id },
  });
  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(presentation);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const presentation = await prisma.presentation.update({
    where: { id: params.id },
    data: {
      title:        body.title?.trim(),
      lyrics:       body.lyrics,
      bgId:         body.bgId,
      transitionId: body.transitionId,
      fontId:       body.fontId,
      sizeId:       body.sizeId,
    },
  });

  return NextResponse.json(presentation);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.presentation.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
