import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { RegistrationStepper } from '@/components/registration/RegistrationStepper';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin } from 'lucide-react';
import type { PublicEventData } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string): Promise<PublicEventData | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      customType: true,
      venue: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      maxSlots: true,
      status: true,
      coverImage: true,
      themeColor: true,
      paymentAccount: {
        select: {
          id: true,
          method: true,
          label: true,
          accountName: true,
          accountNumber: true,
          bankName: true,
          qrCodeUrl: true,
          instructions: true,
        },
      },
      organizations: {
        where: { inviteStatus: 'ACCEPTED' },
        select: {
          orgId: true,
          role: true,
          organization: { select: { name: true, logoUrl: true } },
        },
        orderBy: { role: 'asc' },
      },
      eventChurches: {
        select: {
          church: {
            select: { id: true, name: true, orgId: true, organization: { select: { name: true } } },
          },
        },
      },
      feeItems: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, amount: true, isRequired: true, order: true },
      },
      registrantTypes: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, order: true },
      },
    },
  });

  if (!event) return null;

  const registrationCount = await prisma.registration.count({
    where: { eventId: event.id, status: 'APPROVED' },
  });

  const hostOrg = event.organizations.find((o) => o.role === 'HOST') ?? null;

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    type: event.type,
    customType: event.customType,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
    maxSlots: event.maxSlots,
    status: event.status,
    coverImage: event.coverImage,
    themeColor: event.themeColor,
    paymentAccount: event.paymentAccount ?? null,
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
    churches: event.eventChurches.map((ec) => ({
      id: ec.church.id,
      name: ec.church.name,
      orgName: ec.church.organization.name,
      orgId: ec.church.orgId,
    })),
    feeItems: event.feeItems,
    registrantTypes: event.registrantTypes,
    registrationCount,
  };
}

export default async function RegistrationPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const isClosed = event.status !== 'OPEN';
  const deadlinePassed =
    event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false;
  const slotsLeft =
    event.maxSlots !== null ? event.maxSlots - event.registrationCount : null;
  const isFull = slotsLeft !== null && slotsLeft <= 0;
  const noChurches = event.churches.length === 0;

  const canRegister = !isClosed && !deadlinePassed && !isFull && !noChurches;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const tc = event.themeColor ?? null;
  const requiredFeeTotal = event.feeItems.filter((i) => i.isRequired).reduce((sum, i) => sum + i.amount, 0);
  const hasOptionalFees = event.feeItems.some((i) => !i.isRequired && i.amount > 0);
  const isFreeEvent = requiredFeeTotal === 0 && !hasOptionalFees;

  return (
    <div className="min-h-screen bg-background">
      {/* Theme accent bar */}
      {tc && <div className="h-1 w-full" style={{ backgroundColor: tc }} />}

      {/* Cover */}
      {event.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImage}
          alt={event.title}
          className="w-full h-48 sm:h-64 object-cover"
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Event info */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">
              {event.type === 'OTHER' ? (event.customType || 'Other') : event.type.replace('_', ' ')}
            </Badge>
            {event.status !== 'OPEN' && (
              <Badge variant="destructive">{event.status}</Badge>
            )}
            {isFreeEvent ? (
              <Badge variant="outline">Free</Badge>
            ) : (
              <Badge variant="outline">
                {hasOptionalFees ? 'From ' : ''}₱{requiredFeeTotal.toFixed(2)} / person
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
          {tc && <div className="h-1 w-12 rounded-full" style={{ backgroundColor: tc }} />}
          {event.hostOrg && (
            <p className="text-muted-foreground text-sm">
              Hosted by <span className="font-medium text-foreground">{event.hostOrg.orgName}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" style={tc ? { color: tc } : undefined} />
              {formatDate(event.startDate)} — {formatDate(event.endDate)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" style={tc ? { color: tc } : undefined} />
                {event.venue}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          )}
          {slotsLeft !== null && slotsLeft <= 10 && slotsLeft > 0 && (
            <p className="text-sm text-amber-600 font-medium">
              Only {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining!
            </p>
          )}
        </div>

        {/* Form or closed message */}
        {canRegister ? (
          <div className="border rounded-xl overflow-hidden">
            <div
              className="px-4 sm:px-6 py-4 flex items-center gap-2.5 bg-primary"
              style={tc ? { backgroundColor: tc } : undefined}
            >
              <h2 className="text-base font-semibold text-white">Registration Form</h2>
            </div>
            <div className="p-4 sm:p-6">
              <RegistrationStepper event={event} />
            </div>
          </div>
        ) : (
          <div className="border rounded-xl p-8 text-center space-y-2">
            <p className="text-lg font-semibold">
              {isFull
                ? 'Registration Full'
                : deadlinePassed
                  ? 'Registration Closed'
                  : noChurches
                    ? 'Registration Not Yet Open'
                    : 'Registration Not Available'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isFull
                ? 'All slots have been filled for this event.'
                : deadlinePassed
                  ? 'The registration deadline has passed.'
                  : noChurches
                    ? 'The event organizer has not yet configured the participating churches. Please check back later.'
                    : 'Registration for this event is currently unavailable.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
