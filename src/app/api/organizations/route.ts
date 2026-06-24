import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllOrganizations, listOrganizations } from '@/lib/organization-list';
import { getAccessibleOrgIds, OrgAccessError } from '@/lib/org-access';
import { createOrganizationSchema } from '@/validations/organization.schema';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessibleOrgIds = getAccessibleOrgIds(session);
    const { searchParams } = req.nextUrl;
    const pageParam = searchParams.get('page');

    if (pageParam !== null) {
      const page = Math.max(1, parseInt(pageParam, 10));
      const pageSize = Math.min(
        50,
        Math.max(1, parseInt(searchParams.get('page_size') ?? '10', 10)),
      );
      const query = searchParams.get('query') ?? '';

      const result = await listOrganizations({
        accessibleOrgIds,
        page,
        pageSize,
        query,
      });

      return NextResponse.json(result, { status: 200 });
    }

    const organizations = await getAllOrganizations(accessibleOrgIds);
    return NextResponse.json({ data: organizations }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, logoUrl } = parsed.data;

    const organization = await prisma.organization.create({
      data: {
        name,
        logoUrl: logoUrl || null,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof OrgAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to create organization';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
