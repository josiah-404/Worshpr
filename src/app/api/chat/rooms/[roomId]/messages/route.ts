import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase, getChatChannelName } from '@/lib/supabase';
import { sendMessageSchema } from '@/validations/chat.schema';
import type { ChatMessage } from '@/types/chat.types';

function mapMessage(m: {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: { name: string };
}): ChatMessage {
  return {
    id: m.id,
    roomId: m.roomId,
    senderId: m.senderId,
    senderName: m.sender.name,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orgId: sessionOrgId } = session.user;
  const { roomId } = params;

  try {
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (session.user.role !== 'super_admin' && room.orgId !== sessionOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = Math.min(
      Number(req.nextUrl.searchParams.get('limit') ?? 50),
      100,
    );

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        roomId: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: { select: { name: true } },
      },
    });

    return NextResponse.json({ data: messages.map(mapMessage) });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: senderId, orgId: sessionOrgId } = session.user;
  const { roomId } = params;

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (session.user.role !== 'super_admin' && room.orgId !== sessionOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const created = await prisma.chatMessage.create({
      data: { roomId, senderId, content: parsed.data.content },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: { select: { name: true } },
      },
    });

    const message = mapMessage(created);

    const channelId =
      room.type === 'EVENT' && room.eventId
        ? getChatChannelName('event', room.eventId)
        : getChatChannelName('org', room.orgId);

    await supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'new_message',
      payload: message,
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
