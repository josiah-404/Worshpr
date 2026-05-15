import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRoomSchema } from '@/validations/chat.schema';

const ROOM_SELECT = {
  id: true,
  name: true,
  type: true,
  orgId: true,
  eventId: true,
  createdAt: true,
} as const;

function mapRoom(r: {
  id: string;
  name: string;
  type: string;
  orgId: string;
  eventId: string | null;
  createdAt: Date;
}) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role, orgId: sessionOrgId } = session.user;
  const paramOrgId = req.nextUrl.searchParams.get('orgId');
  const orgId = role === 'super_admin' ? (paramOrgId ?? sessionOrgId) : sessionOrgId;

  if (!orgId) return NextResponse.json({ error: 'No org context' }, { status: 400 });

  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { orgId, type: 'ORG' },
      orderBy: { createdAt: 'asc' },
      select: ROOM_SELECT,
    });

    return NextResponse.json({ data: rooms.map(mapRoom) });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role, orgId: sessionOrgId } = session.user;
  if (role !== 'super_admin' && role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const orgId =
      role === 'super_admin' ? (parsed.data.orgId ?? sessionOrgId) : sessionOrgId;
    if (!orgId) return NextResponse.json({ error: 'No org context' }, { status: 400 });

    const room = await prisma.chatRoom.create({
      data: { name: parsed.data.name, type: 'ORG', orgId },
      select: ROOM_SELECT,
    });

    return NextResponse.json({ data: mapRoom(room) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
