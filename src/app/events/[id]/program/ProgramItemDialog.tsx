'use client';

import { type FC, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgramItemData, ProgramSession, ChurchOption } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12'] as const;
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'] as const;

// ─── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  title:        z.string().min(1, 'Title is required').max(200),
  startHour:    z.string(),
  startMinute:  z.string(),
  startPeriod:  z.enum(['AM', 'PM']),
  hasEndTime:   z.boolean(),
  endHour:      z.string(),
  endMinute:    z.string(),
  endPeriod:    z.enum(['AM', 'PM']),
  session:      z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NONE']),
  churchId:     z.string().optional(),
  presenterName: z.string().max(100).optional(),
  description:  z.string().max(1000).optional(),
  day:          z.number().int().min(1),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildTimeString(v: FormValues): string | undefined {
  if (!v.startHour) return undefined;
  const start = `${v.startHour}:${v.startMinute} ${v.startPeriod}`;
  if (!v.hasEndTime || !v.endHour) return start;
  return `${start} - ${v.endHour}:${v.endMinute} ${v.endPeriod}`;
}

function parseTimeString(time?: string | null): Pick<FormValues,
  'startHour' | 'startMinute' | 'startPeriod' | 'hasEndTime' | 'endHour' | 'endMinute' | 'endPeriod'
> {
  const blank = {
    startHour: '', startMinute: '00', startPeriod: 'AM' as const,
    hasEndTime: false, endHour: '', endMinute: '00', endPeriod: 'AM' as const,
  };
  if (!time) return blank;

  const parsePart = (t: string) => {
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    return { hour: m[1], minute: m[2], period: ((m[3] ?? 'AM').toUpperCase()) as 'AM' | 'PM' };
  };

  const parts = time.split(' - ');
  const s = parsePart(parts[0]);
  if (!s) return blank;

  if (parts.length < 2) {
    return {
      startHour: s.hour, startMinute: s.minute, startPeriod: s.period,
      hasEndTime: false, endHour: '', endMinute: '00', endPeriod: 'AM',
    };
  }
  const e = parsePart(parts[1]);
  return {
    startHour: s.hour, startMinute: s.minute, startPeriod: s.period,
    hasEndTime: !!e, endHour: e?.hour ?? '', endMinute: e?.minute ?? '00', endPeriod: e?.period ?? 'AM',
  };
}

const EMPTY_TIME: Pick<FormValues,
  'startHour' | 'startMinute' | 'startPeriod' | 'hasEndTime' | 'endHour' | 'endMinute' | 'endPeriod'
> = {
  startHour: '', startMinute: '00', startPeriod: 'AM',
  hasEndTime: false, endHour: '', endMinute: '00', endPeriod: 'AM',
};

// ─── Sub-component: compact time picker ────────────────────────────────────────

const TimePicker: FC<{
  hourName:   'startHour'   | 'endHour';
  minuteName: 'startMinute' | 'endMinute';
  periodName: 'startPeriod' | 'endPeriod';
  control:    ReturnType<typeof useForm<FormValues>>['control'];
  setValue:   ReturnType<typeof useForm<FormValues>>['setValue'];
}> = ({ hourName, minuteName, periodName, control, setValue }) => {
  const period = useWatch({ control, name: periodName });

  return (
    <div className="flex items-center gap-1">
      <FormField
        control={control}
        name={hourName}
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-[58px] h-8 text-xs">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <span className="text-muted-foreground text-sm font-semibold select-none">:</span>
      <FormField
        control={control}
        name={minuteName}
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-[58px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <div className="flex rounded-md border border-border overflow-hidden h-8">
        {(['AM', 'PM'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setValue(periodName, p)}
            className={cn(
              'w-9 text-xs font-medium transition-colors',
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProgramItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    time?: string;
    session?: ProgramSession;
    churchId?: string;
    presenterName?: string;
    description?: string;
    day: number;
  }) => void;
  isPending: boolean;
  editing?: ProgramItemData | null;
  churches: ChurchOption[];
  totalDays: number;
  defaultDay: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const ProgramItemDialog: FC<ProgramItemDialogProps> = ({
  open, onClose, onSubmit, isPending, editing, churches, totalDays, defaultDay,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', session: 'NONE', churchId: '', presenterName: '', description: '',
      day: defaultDay, ...EMPTY_TIME,
    },
  });

  const hasEndTime = useWatch({ control: form.control, name: 'hasEndTime' });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        title:        editing.title,
        session:      (editing.session ?? 'NONE') as FormValues['session'],
        churchId:     editing.churchId ?? '',
        presenterName: editing.presenterName ?? '',
        description:  editing.description ?? '',
        day:          editing.day,
        ...parseTimeString(editing.time),
      });
    } else {
      form.reset({
        title: '', session: 'NONE', churchId: '', presenterName: '', description: '',
        day: defaultDay, ...EMPTY_TIME,
      });
    }
  }, [open, editing, defaultDay, form]);

  function handleSubmit(values: FormValues) {
    onSubmit({
      title:        values.title,
      time:         buildTimeString(values),
      session:      values.session !== 'NONE' ? (values.session as ProgramSession) : undefined,
      churchId:     values.churchId     || undefined,
      presenterName: values.presenterName || undefined,
      description:  values.description  || undefined,
      day:          values.day,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Program Item' : 'Add Program Item'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Opening Worship" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Time ─────────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">
                Time{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </p>

              {/* Start */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground w-9 shrink-0">Start</span>
                <TimePicker
                  hourName="startHour"
                  minuteName="startMinute"
                  periodName="startPeriod"
                  control={form.control}
                  setValue={form.setValue}
                />
                {!hasEndTime && (
                  <button
                    type="button"
                    onClick={() => form.setValue('hasEndTime', true)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline ml-1"
                  >
                    <Plus className="h-3 w-3" />
                    End time
                  </button>
                )}
              </div>

              {/* End (optional) */}
              {hasEndTime && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground w-9 shrink-0">End</span>
                  <TimePicker
                    hourName="endHour"
                    minuteName="endMinute"
                    periodName="endPeriod"
                    control={form.control}
                    setValue={form.setValue}
                  />
                  <button
                    type="button"
                    onClick={() => { form.setValue('hasEndTime', false); form.setValue('endHour', ''); }}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Session */}
            <FormField control={form.control} name="session" render={({ field }) => (
              <FormItem>
                <FormLabel>Session</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="MORNING">Morning</SelectItem>
                    <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                    <SelectItem value="EVENING">Evening</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Day — only for multi-day programs */}
            {totalDays > 1 && (
              <FormField control={form.control} name="day" render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: totalDays }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Church */}
            <FormField control={form.control} name="churchId" render={({ field }) => (
              <FormItem>
                <FormLabel>Church</FormLabel>
                <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        <span className="text-muted-foreground text-xs ml-1">({c.orgName})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Presenter */}
            <FormField control={form.control} name="presenterName" render={({ field }) => (
              <FormItem>
                <FormLabel>Presenter Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Bro. Juan dela Cruz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional details..." className="resize-none" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
