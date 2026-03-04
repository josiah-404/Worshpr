import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET /api/users — list all users (exclude password)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users — create a user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
