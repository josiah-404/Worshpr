'use client';

import { type FC, useEffect, useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Church, ImagePlus, Loader2,
  Pencil, Pipette, ScrollText, UserPlus, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useUpdateEvent } from '@/hooks/useUpdateEvent';
import { useGetPaymentAccounts } from '@/hooks/useGetPaymentAccounts';
import { useGetEventChurches } from '@/hooks/useGetEventChurches';
import { useSetEventChurches } from '@/hooks/useSetEventChurches';
import { EventInvitePanel } from '@/app/events/EventInvitePanel';
import { ProgramClient } from './program/ProgramClient';
import { createEventSchema, type CreateEventInput } from '@/validations/event.schema';
import type {
  EventListItem, EventProgramData, ChurchOption, Organization,
  OrgRole, EventType, EventStatus, EventDetails,
} from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const THEME_PRESETS = [
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
];

const TYPE_LABEL: Record<EventType, string> = {
  CAMP: 'Camp', FELLOWSHIP: 'Fellowship', SEMINAR: 'Seminar', WORSHIP_NIGHT: 'Worship Night',
};

const STATUS_CONFIG: Record<EventStatus, { label: string; dot: string; pill: string }> = {
  DRAFT:     { label: 'Draft',     dot: 'bg-zinc-400',    pill: 'bg-zinc-800/80 text-zinc-300' },
  OPEN:      { label: 'Open',      dot: 'bg-emerald-400', pill: 'bg-emerald-950/80 text-emerald-400' },
  CLOSED:    { label: 'Closed',    dot: 'bg-slate-400',   pill: 'bg-slate-800/80 text-slate-300' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-950/80 text-red-400' },
  COMPLETED: { label: 'Completed', dot: 'bg-blue-400',    pill: 'bg-blue-950/80 text-blue-400' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface EventDetailClientProps {
  event: EventListItem;
  initialProgram: EventProgramData | null;
  churches: ChurchOption[];
  organizations: Organization[];
  role: OrgRole;
}

// ─── Details Form ──────────────────────────────────────────────────────────────

interface DetailsFormProps {
  event: EventListItem;
  isSuperAdmin: boolean;
  canEdit: boolean;
  organizations: Organization[];
}

const DetailsForm: FC<DetailsFormProps> = ({
  event, isSuperAdmin, canEdit, organizations,
}) => {
  const router = useRouter();
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useLogoUpload();

  const hostOrgId = event.organizations.find((o) => o.role === 'HOST')?.orgId ?? organizations[0]?.id ?? '';

  const { mutate: updateMutate, isPending: isUpdating } = useUpdateEvent(event.id);
  const { mutate: setChurches } = useSetEventChurches(event.id);

  const [selectedChurchIds, setSelectedChurchIds] = useState<string[]>([]);
  const { data: churchData } = useGetEventChurches(event.id);

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema) as unknown as Resolver<CreateEventInput>,
    defaultValues: {
      title: event.title,
      description: event.description ?? '',
      type: event.type,
      venue: event.venue ?? '',
      startDate: toDatetimeLocal(event.startDate),
      endDate: toDatetimeLocal(event.endDate),
      registrationDeadline: toDatetimeLocal(event.registrationDeadline),
      fee: event.fee,
      maxSlots: event.maxSlots ?? undefined,
      status: event.status,
      coverImage: event.coverImage ?? '',
      themeColor: event.themeColor ?? '',
      paymentAccountId: event.paymentAccount?.id ?? '',
      hostOrgId,
    },
  });

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = form;
  const coverImage = watch('coverImage');
  const themeColor = watch('themeColor');
  const fee = watch('fee');
  const watchedHostOrgId = watch('hostOrgId');

  const { data: paymentAccounts = [] } = useGetPaymentAccounts(
    isSuperAdmin ? (watchedHostOrgId || null) : hostOrgId,
  );

  useEffect(() => {
    if (churchData) {
      setSelectedChurchIds(churchData.participating.map((c) => c.id));
    }
  }, [churchData]);

  function toggleChurch(churchId: string) {
    setSelectedChurchIds((prev) =>
      prev.includes(churchId) ? prev.filter((id) => id !== churchId) : [...prev, churchId],
    );
  }

  const onSubmit = (data: CreateEventInput) => {
    const { hostOrgId: _host, ...updateData } = data;
    updateMutate(updateData, {
      onSuccess: () => {
        setChurches(selectedChurchIds);
        toast.success('Event updated');
        router.refresh();
      },
      onError: () => toast.error('Failed to update event'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Cover Image ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) =>
          handleFileChange(e, coverImage ?? '', (url) => setValue('coverImage', url))
        }
      />

      <div className="space-y-2">
        <button
          type="button"
          disabled={uploading}
          onClick={triggerFilePicker}
          className={cn(
            'group relative w-full aspect-video rounded-lg overflow-hidden',
            'border-2 border-dashed border-border bg-muted/40',
            'transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60',
          )}
        >
          {coverImage ? (
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm font-medium">Click to upload cover image</span>
              <span className="text-xs opacity-60">PNG, JPG, WEBP — max 4 MB</span>
            </div>
          )}
          {!uploading && coverImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlus className="h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white">Change cover</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-sm font-semibold text-white">{uploadProgress}%</span>
              <div className="w-32 h-1 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full bg-white transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </button>
        {coverImage && !uploading && (
          <button
            type="button"
            onClick={() => setValue('coverImage', '')}
            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <X className="h-3 w-3" /> Remove cover image
          </button>
        )}
      </div>

      {/* ── Theme Color ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Theme Color{' '}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </span>
          {themeColor && (
            <button
              type="button"
              onClick={() => setValue('themeColor', '')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {THEME_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('themeColor', color)}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-all hover:scale-110',
                themeColor === color ? 'border-foreground scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <div
            className={cn(
              'relative h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden transition-all hover:scale-110',
              themeColor && !THEME_PRESETS.includes(themeColor)
                ? 'border-foreground scale-110'
                : 'border-dashed border-border',
            )}
            style={themeColor && !THEME_PRESETS.includes(themeColor) ? { backgroundColor: themeColor } : undefined}
            title="Custom color"
          >
            {(!themeColor || THEME_PRESETS.includes(themeColor)) && (
              <Pipette className="absolute inset-0 m-auto h-3 w-3 text-muted-foreground pointer-events-none" />
            )}
            <input
              type="color"
              value={themeColor?.startsWith('#') ? themeColor : '#f97316'}
              onChange={(e) => setValue('themeColor', e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        {themeColor && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border border-border shrink-0" style={{ backgroundColor: themeColor }} />
            <span className="font-mono text-xs text-muted-foreground">{themeColor}</span>
          </div>
        )}
      </div>

      {/* ── Host Organization (super_admin only) ── */}
      {isSuperAdmin && (
        <FormField label="Host Organization" htmlFor="hostOrgId">
          <Controller
            name="hostOrgId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="hostOrgId">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.hostOrgId && <p className="text-xs text-destructive">{errors.hostOrgId.message}</p>}
        </FormField>
      )}

      {/* ── Title ── */}
      <FormField label="Event Title" htmlFor="title">
        <Input id="title" placeholder="e.g. Youth Camp 2026" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </FormField>

      {/* ── Description ── */}
      <FormField label="Description" htmlFor="description" hint="(optional)">
        <Textarea id="description" placeholder="Brief description of the event..." rows={3} {...register('description')} />
      </FormField>

      {/* ── Type + Status ── */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Event Type" htmlFor="type">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAMP">Camp</SelectItem>
                  <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                  <SelectItem value="SEMINAR">Seminar</SelectItem>
                  <SelectItem value="WORSHIP_NIGHT">Worship Night</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </FormField>

        <FormField label="Status" htmlFor="status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      {/* ── Venue ── */}
      <FormField label="Venue" htmlFor="venue" hint="(optional)">
        <Input id="venue" placeholder="e.g. Camp Lambayong, South Cotabato" {...register('venue')} />
      </FormField>

      {/* ── Dates ── */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Date & Time" htmlFor="startDate">
          <Input id="startDate" type="datetime-local" {...register('startDate')} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </FormField>
        <FormField label="End Date & Time" htmlFor="endDate">
          <Input id="endDate" type="datetime-local" {...register('endDate')} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </FormField>
      </div>

      <FormField label="Registration Deadline" htmlFor="registrationDeadline" hint="(optional)">
        <Input id="registrationDeadline" type="datetime-local" {...register('registrationDeadline')} />
      </FormField>

      {/* ── Fee + Slots ── */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Registration Fee (₱)" htmlFor="fee">
          <Input id="fee" type="number" min={0} step={0.01} placeholder="0" {...register('fee')} />
          {errors.fee && <p className="text-xs text-destructive">{errors.fee.message}</p>}
        </FormField>
        <FormField label="Max Slots" htmlFor="maxSlots" hint="(optional)">
          <Input id="maxSlots" type="number" min={1} step={1} placeholder="Unlimited" {...register('maxSlots')} />
          {errors.maxSlots && <p className="text-xs text-destructive">{errors.maxSlots.message}</p>}
        </FormField>
      </div>

      {/* ── Payment Account ── */}
      {Number(fee) > 0 && (
        <FormField label="Payment Account" htmlFor="paymentAccountId" hint="(optional)">
          <Controller
            name="paymentAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
              >
                <SelectTrigger id="paymentAccountId">
                  <SelectValue placeholder="Select payment account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {paymentAccounts
                    .filter((a) => a.isActive)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label} · {a.accountNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Where registrants will send their online payment
          </p>
        </FormField>
      )}

      {/* ── Participating Churches ── */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">Participating Churches</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select churches whose members can register for this event
          </p>
        </div>
        {!churchData ? (
          <p className="text-xs text-muted-foreground">Loading churches…</p>
        ) : churchData.participating.length === 0 && churchData.available.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 flex items-center gap-3 text-muted-foreground">
            <Church className="h-4 w-4 shrink-0" />
            <p className="text-xs">
              No churches configured for this event&apos;s organizations yet.
              Add churches under <span className="font-medium">Management → Churches</span>.
            </p>
          </div>
        ) : (
          <div className="rounded-md border p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {[...churchData.participating, ...churchData.available].map((church) => {
              const isSelected = selectedChurchIds.includes(church.id);
              return (
                <button
                  key={church.id}
                  type="button"
                  onClick={() => toggleChurch(church.id)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-muted/50 border border-transparent',
                  )}
                >
                  <div>
                    <span className="font-medium">{church.name}</span>
                    {'location' in church && church.location && (
                      <span className="text-xs text-muted-foreground ml-1.5">{church.location as string}</span>
                    )}
                  </div>
                  {isSelected && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">
                      Selected
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Actions ── */}
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating || uploading}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const EventDetailClient: FC<EventDetailClientProps> = ({
  event,
  initialProgram,
  churches,
  organizations,
  role,
}) => {
  const router = useRouter();
  const canEdit = role !== 'officer';
  const isSuperAdmin = role === 'super_admin';
  const hostOrg = event.organizations.find((o) => o.role === 'HOST');

  const [invitePanelOpen, setInvitePanelOpen] = useState(false);

  const eventDetails: EventDetails = {
    venue: event.venue,
    startDate: event.startDate,
    endDate: event.endDate,
    description: event.description,
    organizations: event.organizations.map((o) => ({ name: o.orgName, role: o.role })),
  };

  const status = STATUS_CONFIG[event.status];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5"
          onClick={() => router.push('/events')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold truncate">{event.title}</h1>
            <Badge variant="outline" className="text-xs shrink-0">
              {TYPE_LABEL[event.type as EventType]}
            </Badge>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0',
              status.pill,
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          </div>
          {hostOrg && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {hostOrg.orgName}
            </p>
          )}
        </div>

        {canEdit && (
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setInvitePanelOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Collaborators
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Tabs ── */}
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="details" className="gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Details
          </TabsTrigger>
          <TabsTrigger value="program" className="gap-1.5 text-xs">
            <ScrollText className="h-3.5 w-3.5" />
            Program
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-5 max-w-2xl mx-auto">
          <DetailsForm
            event={event}
            isSuperAdmin={isSuperAdmin}
            canEdit={canEdit}
            organizations={organizations}
          />
        </TabsContent>

        <TabsContent value="program" className="mt-5">
          <ProgramClient
            eventId={event.id}
            eventTitle={event.title}
            eventType={event.type}
            initialProgram={initialProgram}
            churches={churches}
            eventDetails={eventDetails}
          />
        </TabsContent>
      </Tabs>

      {invitePanelOpen && (
        <EventInvitePanel
          open={invitePanelOpen}
          onOpenChange={setInvitePanelOpen}
          event={event}
          organizations={organizations}
        />
      )}
    </div>
  );
};
