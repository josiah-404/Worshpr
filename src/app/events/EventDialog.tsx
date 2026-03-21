'use client';

import { type FC, useEffect, useRef } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { createEventSchema, type CreateEventInput } from '@/validations/event.schema';
import type { EventListItem, Organization } from '@/types';

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

  const isPending = isCreating || isUpdating;

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
      hostOrgId,
    },
  });

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form;
  const coverImage = watch('coverImage');

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
        hostOrgId,
      });
    }
  }, [editingEvent, open, reset, hostOrgId]);

  const onSubmit = (data: CreateEventInput) => {
    if (editingEvent) {
      const { hostOrgId: _host, ...updateData } = data;
      updateMutate(updateData, {
        onSuccess: () => {
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
