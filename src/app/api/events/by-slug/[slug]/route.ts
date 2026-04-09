import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        venue: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        fee: true,
        maxSlots: true,
        status: true,
        coverImage: true,
        organizations: {
          where: { inviteStatus: 'ACCEPTED' },
          select: {
            orgId: true,
            role: true,
            organization: { select: { name: true, logoUrl: true } },
          },
          orderBy: { role: 'asc' }, // HOST before COLLABORATOR
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const registrationCount = await prisma.registration.count({
      where: { eventId: event.id, status: 'APPROVED' },
    });

    const hostOrg = event.organizations.find((o) => o.role === 'HOST') ?? null;

    const data = {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      type: event.type,
      venue: event.venue,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
      fee: event.fee,
      maxSlots: event.maxSlots,
      status: event.status,
      coverImage: event.coverImage,
      hostOrg: hostOrg
        ? {
            orgId: hostOrg.orgId,
            orgName: hostOrg.organization.name,
            orgLogoUrl: hostOrg.organization.logoUrl,
          }
        : null,
      organizations: event.organizations.map((o) => ({
        orgId: o.orgId,
        orgName: o.organization.name,
        orgLogoUrl: o.organization.logoUrl,
        role: o.role as 'HOST' | 'COLLABORATOR',
      })),
      registrationCount,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
