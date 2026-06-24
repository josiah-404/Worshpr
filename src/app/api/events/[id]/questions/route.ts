import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEventHostAccess } from '@/lib/event-access';
import { isOfficer, OrgAccessError } from '@/lib/org-access';
import { setQuestionsSchema, type QuestionInput } from '@/validations/event.schema';
import { buildQuestionTree } from '@/lib/eventQuestions';
import type { Prisma } from '@/generated/prisma';

// Children need their parent's freshly-generated id, so the tree is created top-down inside
// the transaction rather than via a single flat createMany.
async function createQuestionTree(
  tx: Prisma.TransactionClient,
  eventId: string,
  items: QuestionInput[],
  parentQuestionId: string | null,
) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const created = await tx.eventQuestion.create({
      data: {
        eventId,
        parentQuestionId,
        triggerOption: parentQuestionId ? item.triggerOption ?? null : null,
        label: item.label,
        type: item.type,
        options: item.type === 'CHOICE' ? item.options : [],
        isRequired: item.isRequired,
        order: i,
      },
    });
    if (item.children.length > 0) {
      await createQuestionTree(tx, eventId, item.children, created.id);
    }
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await prisma.eventQuestion.findMany({
      where: { eventId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: buildQuestionTree(rows) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isOfficer(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, allowed } = await getEventHostAccess(session, params.id);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = setQuestionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items } = parsed.data;

    const rows = await prisma.$transaction(async (tx) => {
      await tx.eventQuestion.deleteMany({ where: { eventId: params.id } });
      await createQuestionTree(tx, params.id, items, null);
      return tx.eventQuestion.findMany({ where: { eventId: params.id }, orderBy: { order: 'asc' } });
    });

    return NextResponse.json({ data: buildQuestionTree(rows) }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 });
  }
}
