import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  assertCanManageOrg,
  isOfficer,
  orgIdWhereClause,
  OrgAccessError,
} from '@/lib/org-access';

const createChurchSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Church name is required'),
  location: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (isOfficer(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const queryOrgId = req.nextUrl.searchParams.get('orgId') ?? undefined;
    const orgFilter = orgIdWhereClause(session, queryOrgId);

    const churches = await prisma.church.findMany({
      where: orgFilter,
      orderBy: [{ orgId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        orgId: true,
        name: true,
        location: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { name: true } },
      },
    });

    const data = churches.map((c) => ({
      id: c.id,
      orgId: c.orgId,
      orgName: c.organization.name,
      name: c.name,
      location: c.location,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch churches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (isOfficer(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = createChurchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    assertCanManageOrg(session, parsed.data.orgId);

    const church = await prisma.church.create({
      data: {
        orgId: parsed.data.orgId,
        name: parsed.data.name,
        location: parsed.data.location ?? null,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        location: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { name: true } },
      },
    });

    return NextResponse.json({
      data: {
        ...church,
        orgName: church.organization.name,
        createdAt: church.createdAt.toISOString(),
        updatedAt: church.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to create church' }, { status: 500 });
  }
}
