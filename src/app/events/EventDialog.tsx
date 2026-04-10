'use client';

import { type FC, useEffect, useRef, useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Church, ImagePlus, Loader2, Pipette, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { useUpdateEvent } from '@/hooks/useUpdateEvent';
import { useGetPaymentAccounts } from '@/hooks/useGetPaymentAccounts';
import { useGetEventChurches } from '@/hooks/useGetEventChurches';
import { useSetEventChurches } from '@/hooks/useSetEventChurches';
import { createEventSchema, type CreateEventInput } from '@/validations/event.schema';
import type { EventListItem, Organization } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────

const THEME_PRESETS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: EventListItem | null;
  hostOrgId: string;
  isSuperAdmin: boolean;
  organizations: Organization[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export const EventDialog: FC<EventDialogProps> = ({
  open,
  onOpenChange,
  editingEvent,
  hostOrgId,
  isSuperAdmin,
  organizations,
}) => {
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useLogoUpload();

  const { mutate: createMutate, isPending: isCreating } = useCreateEvent();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateEvent(
    editingEvent?.id ?? '',
  );
  const { mutate: setChurches } = useSetEventChurches(editingEvent?.id ?? '');

  const isPending = isCreating || isUpdating;

  // ── Church selection (edit mode only) ──────────────────────────────────────
  const [selectedChurchIds, setSelectedChurchIds] = useState<string[]>([]);
  const { data: churchData } = useGetEventChurches(editingEvent?.id ?? null);

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema) as unknown as Resolver<CreateEventInput>,
    defaultValues: {
      title: '',
      description: '',
      type: 'FELLOWSHIP',
      venue: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      fee: 0,
      maxSlots: undefined,
      status: 'DRAFT',
      coverImage: '',
      themeColor: '',
      paymentAccountId: '',
      hostOrgId,
    },
  });

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form;
  const coverImage = watch('coverImage');
  const themeColor = watch('themeColor');
  const fee = watch('fee');
  const watchedHostOrgId = watch('hostOrgId');

  const { data: paymentAccounts = [] } = useGetPaymentAccounts(
    isSuperAdmin ? (watchedHostOrgId || null) : hostOrgId,
  );

  // Sync church selection when data loads
  useEffect(() => {
    if (churchData) {
      setSelectedChurchIds(churchData.participating.map((c) => c.id));
    } else if (!editingEvent) {
      setSelectedChurchIds([]);
    }
  }, [churchData, editingEvent]);

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      reset({
        title: editingEvent.title,
        description: editingEvent.description ?? '',
        type: editingEvent.type,
        venue: editingEvent.venue ?? '',
        startDate: toDatetimeLocal(editingEvent.startDate),
        endDate: toDatetimeLocal(editingEvent.endDate),
        registrationDeadline: toDatetimeLocal(editingEvent.registrationDeadline),
        fee: editingEvent.fee,
        maxSlots: editingEvent.maxSlots ?? undefined,
        status: editingEvent.status,
        coverImage: editingEvent.coverImage ?? '',
        themeColor: editingEvent.themeColor ?? '',
        paymentAccountId: editingEvent.paymentAccount?.id ?? '',
        hostOrgId: editingEvent.organizations.find((o) => o.role === 'HOST')?.orgId ?? hostOrgId,
      });
    } else {
      reset({
        title: '',
        description: '',
        type: 'FELLOWSHIP',
        venue: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        fee: 0,
        maxSlots: undefined,
        status: 'DRAFT',
        coverImage: '',
        themeColor: '',
        paymentAccountId: '',
        hostOrgId,
      });
    }
  }, [editingEvent, open, reset, hostOrgId]);

  function toggleChurch(churchId: string) {
    setSelectedChurchIds((prev) =>
      prev.includes(churchId) ? prev.filter((id) => id !== churchId) : [...prev, churchId],
    );
  }

  const onSubmit = (data: CreateEventInput) => {
    if (editingEvent) {
      const { hostOrgId: _host, ...updateData } = data;
      updateMutate(updateData, {
        onSuccess: () => {
          // Save church selections alongside the event update
          setChurches(selectedChurchIds);
          toast.success('Event updated');
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to update event'),
      });
    } else {
      createMutate(data, {
        onSuccess: () => {
          toast.success('Event created');
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error('Failed to create event', {
            description: err.message,
          }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 space-y-5 py-2 pr-1"
        >
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
                    <div
                      className="h-full bg-white transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
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
              {/* Custom color picker */}
              <div
                className={cn(
                  'relative h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden transition-all hover:scale-110',
                  themeColor && !THEME_PRESETS.includes(themeColor)
                    ? 'border-foreground scale-110'
                    : 'border-dashed border-border',
                )}
                style={
                  themeColor && !THEME_PRESETS.includes(themeColor)
                    ? { backgroundColor: themeColor }
                    : undefined
                }
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
                <div
                  className="h-4 w-4 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: themeColor }}
                />
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
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.hostOrgId && (
                <p className="text-xs text-destructive">{errors.hostOrgId.message}</p>
              )}
            </FormField>
          )}

          {/* ── Title ── */}
          <FormField label="Event Title" htmlFor="title">
            <Input
              id="title"
              placeholder="e.g. Youth Camp 2026"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </FormField>

          {/* ── Description ── */}
          <FormField label="Description" htmlFor="description" hint="(optional)">
            <Textarea
              id="description"
              placeholder="Brief description of the event..."
              rows={3}
              {...register('description')}
            />
          </FormField>

          {/* ── Type + Status ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Type" htmlFor="type">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAMP">Camp</SelectItem>
                      <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                      <SelectItem value="SEMINAR">Seminar</SelectItem>
                      <SelectItem value="WORSHIP_NIGHT">Worship Night</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </FormField>

            <FormField label="Status" htmlFor="status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
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
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </FormField>

            <FormField label="End Date & Time" htmlFor="endDate">
              <Input id="endDate" type="datetime-local" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </FormField>
          </div>

          <FormField label="Registration Deadline" htmlFor="registrationDeadline" hint="(optional)">
            <Input id="registrationDeadline" type="datetime-local" {...register('registrationDeadline')} />
          </FormField>

          {/* ── Fee + Slots ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Registration Fee (₱)" htmlFor="fee">
              <Input
                id="fee"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                {...register('fee')}
              />
              {errors.fee && (
                <p className="text-xs text-destructive">{errors.fee.message}</p>
              )}
            </FormField>

            <FormField label="Max Slots" htmlFor="maxSlots" hint="(optional)">
              <Input
                id="maxSlots"
                type="number"
                min={1}
                step={1}
                placeholder="Unlimited"
                {...register('maxSlots')}
              />
              {errors.maxSlots && (
                <p className="text-xs text-destructive">{errors.maxSlots.message}</p>
              )}
            </FormField>
          </div>

          {/* ── Payment Account (only when fee > 0) ── */}
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

          {/* ── Participating Churches (edit mode only) ── */}
          {editingEvent && (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Participating Churches</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select churches from this event&apos;s organizations whose members can register
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
                          {church.location && (
                            <span className="text-xs text-muted-foreground ml-1.5">{church.location}</span>
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
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || uploading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || uploading}>
              {isPending ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
