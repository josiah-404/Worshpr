import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase, getChatChannelName } from '@/lib/supabase';
import type { ReactionGroup } from '@/types/chat.types';

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

function groupReactions(
  reactions: { emoji: string; userId: string }[],
): ReactionGroup[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const existing = map.get(r.emoji) ?? [];
    existing.push(r.userId);
    map.set(r.emoji, existing);
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    userIds,
  }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: userId, orgId: sessionOrgId } = session.user;
  const { messageId } = params;

  try {
    const body = await req.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { emoji } = parsed.data;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        room: {
          select: {
            orgId: true,
            type: true,
            eventId: true,
          },
        },
      },
    });

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (session.user.role !== 'super_admin' && message.room.orgId !== sessionOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingSame = await prisma.chatMessageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existingSame) {
      // same emoji → toggle off
      await prisma.chatMessageReaction.delete({ where: { id: existingSame.id } });
    } else {
      // different or no emoji → delete any prior reaction from this user, then create
      await prisma.chatMessageReaction.deleteMany({ where: { messageId, userId } });
      await prisma.chatMessageReaction.create({ data: { messageId, userId, emoji } });
    }

    const updated = await prisma.chatMessageReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });

    const reactions = groupReactions(updated);

    const channelId =
      message.room.type === 'EVENT' && message.room.eventId
        ? getChatChannelName('event', message.room.eventId)
        : getChatChannelName('org', message.room.orgId);

    await supabase.channel(channelId).httpSend('reaction_update', { messageId, reactions });

    return NextResponse.json({ data: reactions });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
