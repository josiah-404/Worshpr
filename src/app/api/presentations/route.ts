import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(presentations);
}

export async function POST(req: Request) {
  const { title, lyrics, bgId, transitionId, fontId, sizeId } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const presentation = await prisma.presentation.create({
    data: {
      title: title.trim(),
      lyrics:       lyrics       ?? "",
      bgId:         bgId         ?? "deep-space",
      transitionId: transitionId ?? "fade",
      fontId:       fontId       ?? "inter",
      sizeId:       sizeId       ?? "md",
    },
  });

  return NextResponse.json(presentation, { status: 201 });
}
