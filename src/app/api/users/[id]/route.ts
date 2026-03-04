import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// PUT /api/users/:id — update a user
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, email, role, password } = body;

    const data: Record<string, unknown> = { name, email, role };

    // Only re-hash password if a new one was provided
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/:id — delete a user
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
