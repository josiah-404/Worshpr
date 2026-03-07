import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ORG_KEY = 'org_default';
const DAILY_LIMIT = 20;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** GET /api/ai-search-quota — returns the current quota record for today. */
export async function GET() {
  try {
    const today = todayIso();

    const record = await prisma.aiSearchQuota.upsert({
      where: { orgKey: ORG_KEY },
      update: {},
      create: { orgKey: ORG_KEY, date: today, used: 0 },
    });

    const used = record.date === today ? record.used : 0;

    return NextResponse.json(
      { data: { used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used), date: today } },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const consumeSchema = z.object({ amount: z.number().int().min(1).max(5).default(1) });

/** POST /api/ai-search-quota — increments usage by `amount` (default 1). Returns updated record. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = consumeSchema.safeParse(body);
    const amount = parsed.success ? parsed.data.amount : 1;

    const today = todayIso();

    const existing = await prisma.aiSearchQuota.findUnique({ where: { orgKey: ORG_KEY } });

    const currentUsed = existing?.date === today ? existing.used : 0;

    if (currentUsed >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily AI search quota exhausted.',
          data: { used: currentUsed, limit: DAILY_LIMIT, remaining: 0, date: today },
        },
        { status: 429 },
      );
    }

    const updated = await prisma.aiSearchQuota.upsert({
      where: { orgKey: ORG_KEY },
      update: { date: today, used: currentUsed + amount },
      create: { orgKey: ORG_KEY, date: today, used: amount },
    });

    const used = updated.date === today ? updated.used : amount;

    return NextResponse.json(
      { data: { used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used), date: today } },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
