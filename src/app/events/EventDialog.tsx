'use client';

import { useEffect, type FC } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CreateEventInput } from '@/validations/event.schema';
import type { Event } from '@/types/event.types';
import type { Organization } from '@/types';

// ── Form schema (string-based for HTML inputs) ───────────────────────────────

const formSchema = z
  .object({
    orgId: z.string().min(1, 'Organization is required'),
    theme: z.string().min(1, 'Theme is required').max(200),
    description: z.string(),
    type: z.enum(['camp', 'fellowship', 'seminar']),
    venue: z.string(),
    isOngoing: z.enum(['true', 'false']),
    isOpen: z.enum(['true', 'false']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    registrationDeadline: z.string(),
    registrationFee: z.coerce.number().min(0),
    maxSlots: z.string(),
    status: z.enum(['draft', 'open', 'closed', 'cancelled', 'completed']),
    coverImageUrl: z.string(),
  })
  .refine((d) => !d.endDate || !d.startDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof formSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: Event | null;
  organizations: Organization[];
  loading: boolean;
  error: string;
  onSubmit: (values: CreateEventInput) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const EMPTY: FormValues = {
  orgId: '',
  theme: '',
  description: '',
  type: 'fellowship',
  venue: '',
  isOngoing: 'false',
  isOpen: 'false',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  registrationFee: 0,
  maxSlots: '',
  status: 'draft',
  coverImageUrl: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const EventDialog: FC<EventDialogProps> = ({
  open,
  onOpenChange,
  editingEvent,
  organizations,
  loading,
  error,
  onSubmit,
}) => {
  const { data: session } = useSession();
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useLogoUpload();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as Resolver<FormValues, any>,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    if (editingEvent) {
      form.reset({
        orgId: editingEvent.orgId,
        theme: editingEvent.theme,
        description: editingEvent.description ?? '',
        type: editingEvent.type,
        venue: editingEvent.venue ?? '',
        isOngoing: editingEvent.isOngoing ? 'true' : 'false',
        isOpen: editingEvent.isOpen ? 'true' : 'false',
        startDate: toDateInput(editingEvent.startDate),
        endDate: toDateInput(editingEvent.endDate),
        registrationDeadline: toDateInput(editingEvent.registrationDeadline),
        registrationFee: editingEvent.registrationFee,
        maxSlots: editingEvent.maxSlots?.toString() ?? '',
        status: editingEvent.status,
        coverImageUrl: editingEvent.coverImageUrl ?? '',
      });
    } else {
      form.reset(EMPTY);
    }
  }, [open, editingEvent, form]);

  async function handleSubmit(values: FormValues) {
    await onSubmit({
      orgId: values.orgId,
      theme: values.theme,
      description: values.description || undefined,
      type: values.type,
      venue: values.venue || undefined,
      isOngoing: values.isOngoing === 'true',
      isOpen: values.isOpen === 'true',
      startDate: values.startDate,
      endDate: values.endDate,
      registrationDeadline: values.registrationDeadline || undefined,
      registrationFee: values.registrationFee,
      maxSlots: values.maxSlots ? Number(values.maxSlots) : null,
      status: values.status,
      coverImageUrl: values.coverImageUrl || undefined,
      createdBy: session?.user?.id ?? '',
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Row 1: Theme + Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme / Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event theme or title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="camp">Camp</SelectItem>
                        <SelectItem value="fellowship">Fellowship</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description…" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 2: Organization + Venue */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Location or venue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Start + End Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Reg. Deadline + Fee + Max Slots */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="registrationDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reg. Deadline</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee (₱)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxSlots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Slots</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="Unlimited" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Status + Reg. Open + Ongoing */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Open</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isOngoing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ongoing</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cover Image Upload */}
            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(e, field.value, (url) =>
                            form.setValue('coverImageUrl', url),
                          )
                        }
                      />

                      {/* Upload area */}
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={triggerFilePicker}
                        className={cn(
                          'group relative w-full h-36 rounded-lg overflow-hidden',
                          'border-2 border-dashed border-border bg-muted/40',
                          'transition-colors hover:border-primary/50 hover:bg-muted',
                          'disabled:opacity-60 disabled:cursor-not-allowed',
                        )}
                      >
                        {field.value ? (
                          <img
                            src={field.value}
                            alt="Cover"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                            <ImagePlus className="h-7 w-7" />
                            <span className="text-xs font-medium">Click to upload cover image</span>
                            <span className="text-[11px] opacity-60">PNG, JPG, WEBP — max 4 MB</span>
                          </div>
                        )}

                        {/* Hover overlay (when image exists) */}
                        {field.value && !uploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImagePlus className="h-5 w-5 text-white" />
                            <span className="text-xs font-medium text-white">Change image</span>
                          </div>
                        )}

                        {/* Upload progress overlay */}
                        {uploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                            <span className="text-sm font-semibold text-white">{uploadProgress}%</span>
                            <div className="w-32 h-1 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full bg-white transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </button>

                      {/* Remove button */}
                      {field.value && !uploading && (
                        <button
                          type="button"
                          onClick={() => form.setValue('coverImageUrl', '')}
                          className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <X className="h-3 w-3" /> Remove image
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : editingEvent ? 'Save Changes' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
