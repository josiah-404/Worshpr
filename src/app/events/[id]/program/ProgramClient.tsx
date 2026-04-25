'use client';

import { type FC, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft, Plus, GripVertical, Pencil, Trash2,
  Loader2, Sun, Sunset, Moon, CalendarDays, Church, FileDown, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProgramItemDialog } from './ProgramItemDialog';
import { TourTrigger } from '@/components/guides/TourTrigger';
import { useGetProgram } from '@/hooks/useGetProgram';
import { useUpsertProgram } from '@/hooks/useUpsertProgram';
import { useCreateProgramItem } from '@/hooks/useCreateProgramItem';
import { useUpdateProgramItem } from '@/hooks/useUpdateProgramItem';
import { useDeleteProgramItem } from '@/hooks/useDeleteProgramItem';
import { useReorderProgramItems } from '@/hooks/useReorderProgramItems';
import type {
  EventProgramData, ProgramItemData, ProgramStatus,
  ProgramSession, ChurchOption, EventDetails,
} from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProgramStatus, { label: string; className: string }> = {
  DRAFT:   { label: 'Draft',    className: 'border-muted-foreground/40 text-muted-foreground' },
  PENDING: { label: 'Pending',  className: 'border-amber-500/50 text-amber-500' },
  FINAL:   { label: 'Final',    className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
};

const SESSION_CONFIG: Record<ProgramSession, { label: string; icon: React.ElementType; className: string }> = {
  MORNING:   { label: 'Morning Session',   icon: Sun,    className: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  AFTERNOON: { label: 'Afternoon Session', icon: Sunset, className: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  EVENING:   { label: 'Evening Session',   icon: Moon,   className: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-PH', opts);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}–${e.toLocaleDateString('en-PH', opts)}`;
  }
  return `${s.toLocaleDateString('en-PH', opts)} – ${e.toLocaleDateString('en-PH', opts)}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProgramClientProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
  initialProgram: EventProgramData | null;
  churches: ChurchOption[];
  eventDetails: EventDetails;
}

// ─── Sub-component: Sortable Session Header Row ───────────────────────────────

const SortableSessionHeaderRow: FC<{
  item: ProgramItemData;
  onDelete: () => void;
  isPending: boolean;
}> = ({ item, onDelete, isPending }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isPending,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const cfg = item.session ? SESSION_CONFIG[item.session] : null;
  const Icon = cfg?.icon ?? Sun;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-semibold',
        cfg?.className ?? 'bg-muted/50 border-border text-muted-foreground',
        isDragging && 'opacity-50 shadow-lg z-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0 touch-none"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.title}</span>
      <Button
        variant="ghost" size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={onDelete} disabled={isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// ─── Sub-component: Sortable Program Item Row ─────────────────────────────────

const SortableProgramItemRow: FC<{
  item: ProgramItemData;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
}> = ({ item, onEdit, onDelete, isPending }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isPending,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors group',
        isDragging && 'opacity-50 shadow-lg z-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className={cn('flex-1 min-w-0', !(item.churchName || item.presenterName) && 'flex items-center')}>
        <div className="flex items-center gap-2 flex-wrap">
          {item.time && (
            <span className="text-xs font-mono text-muted-foreground shrink-0">{item.time}</span>
          )}
          <span className="text-sm font-medium truncate">{item.title}</span>
          {item.session && (
            <Badge variant="outline" className={cn('text-xs py-0', SESSION_CONFIG[item.session]?.className)}>
              {item.session.charAt(0) + item.session.slice(1).toLowerCase()}
            </Badge>
          )}
        </div>
        {(item.churchName || item.presenterName) && (
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {item.churchName && <Church className="h-3 w-3 shrink-0" />}
            <span>{[item.churchName, item.presenterName].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onEdit} disabled={isPending}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete} disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const ProgramClient: FC<ProgramClientProps> = ({
  eventId,
  eventTitle,
  eventType,
  initialProgram,
  churches,
  eventDetails,
}) => {
  const router = useRouter();
  const isCamp = eventType === 'CAMP';

  const { data: program = null } = useGetProgram(eventId, initialProgram);
  const [activeDay, setActiveDay] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramItemData | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedPrintDays, setSelectedPrintDays] = useState<Set<number>>(new Set());
  const [printPageSize, setPrintPageSize] = useState<'a4' | 'letter' | 'folio' | 'legal'>('a4');

  const { mutate: upsertProgram, isPending: isUpsertPending } = useUpsertProgram(eventId);
  const { mutate: createItem, isPending: isCreatePending } = useCreateProgramItem(eventId);
  const { mutate: updateItem, isPending: isUpdatePending } = useUpdateProgramItem(eventId);
  const { mutate: deleteItem, isPending: isDeletePending } = useDeleteProgramItem(eventId);
  const { mutate: reorder, isPending: isReorderPending } = useReorderProgramItems(eventId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isAnyPending = isUpsertPending || isCreatePending || isUpdatePending || isDeletePending || isReorderPending;

  const totalDays = program?.totalDays ?? 1;
  const status = (program?.status ?? 'DRAFT') as ProgramStatus;

  // Items for the active day, sorted by order
  const dayItems = useMemo(
    () => (program?.items ?? []).filter((i) => i.day === activeDay).sort((a, b) => a.order - b.order),
    [program, activeDay],
  );

  // ─── Status ────────────────────────────────────────────────────────────────

  function handleStatusChange(newStatus: ProgramStatus) {
    upsertProgram(
      { status: newStatus },
      {
        onSuccess: () => toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`),
        onError: () => toast.error('Failed to update status'),
      },
    );
  }

  // ─── Day management ────────────────────────────────────────────────────────

  function handleAddDay() {
    const newTotal = totalDays + 1;
    upsertProgram(
      { totalDays: newTotal },
      {
        onSuccess: () => setActiveDay(newTotal),
        onError: () => toast.error('Failed to add day'),
      },
    );
  }

  function handleRemoveDay() {
    if (totalDays <= 1) return;
    const hasItems = (program?.items ?? []).some((i) => i.day === totalDays);
    if (hasItems) {
      toast.error(`Day ${totalDays} still has items. Remove them first.`);
      return;
    }
    upsertProgram(
      { totalDays: totalDays - 1 },
      {
        onSuccess: () => {
          if (activeDay > totalDays - 1) setActiveDay(totalDays - 1);
        },
        onError: () => toast.error('Failed to remove day'),
      },
    );
  }

  // ─── Session headers ───────────────────────────────────────────────────────

  function addSessionHeader(session: ProgramSession) {
    const LABELS: Record<ProgramSession, string> = {
      MORNING: 'Morning Session',
      AFTERNOON: 'Afternoon Session',
      EVENING: 'Evening Session',
    };
    createItem(
      { day: activeDay, type: 'SESSION_HEADER', session, title: LABELS[session] },
      { onError: () => toast.error('Failed to add session header') },
    );
  }

  // ─── Item CRUD ─────────────────────────────────────────────────────────────

  function handleItemSubmit(values: {
    title: string; time?: string; session?: ProgramSession;
    churchId?: string; presenterName?: string; description?: string; day: number;
  }) {
    if (editingItem) {
      updateItem(
        {
          itemId: editingItem.id,
          payload: {
            title: values.title,
            time: values.time || null,
            session: values.session || null,
            churchId: values.churchId || null,
            presenterName: values.presenterName || null,
            description: values.description || null,
            day: values.day,
          },
        },
        {
          onSuccess: () => {
            toast.success('Item updated');
            setDialogOpen(false);
            setEditingItem(null);
          },
          onError: () => toast.error('Failed to update item'),
        },
      );
    } else {
      createItem(
        { ...values, type: 'ITEM' },
        {
          onSuccess: () => {
            toast.success('Item added');
            setDialogOpen(false);
          },
          onError: () => toast.error('Failed to add item'),
        },
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deletingItemId) return;
    deleteItem(deletingItemId, {
      onSuccess: () => {
        toast.success('Item removed');
        setDeletingItemId(null);
      },
      onError: () => toast.error('Failed to delete item'),
    });
  }

  // ─── Reorder (drag-and-drop) ───────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = dayItems.findIndex((i) => i.id === active.id);
    const newIndex = dayItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(dayItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    const optimistic = (program?.items ?? [])
      .filter((i) => i.day !== activeDay)
      .concat(reordered)
      .sort((a, b) => a.day - b.day || a.order - b.order);

    reorder(
      {
        items: reordered.map((i) => ({ id: i.id, order: i.order })),
        optimistic,
      },
      { onError: () => toast.error('Failed to reorder') },
    );
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  function exportToCSV() {
    const allItems = (program?.items ?? []).sort((a, b) => a.day - b.day || a.order - b.order);
    const dateRange = formatDateRange(eventDetails.startDate, eventDetails.endDate);
    const hostOrgs = eventDetails.organizations.filter((o) => o.role === 'HOST').map((o) => o.name).join(', ');
    const coOrgs = eventDetails.organizations.filter((o) => o.role !== 'HOST').map((o) => o.name).join(', ');

    const rows: string[][] = [];
    rows.push(['Event', eventTitle]);
    rows.push(['Date', dateRange]);
    if (eventDetails.venue) rows.push(['Venue', eventDetails.venue]);
    if (hostOrgs) rows.push(['Hosted by', hostOrgs]);
    if (coOrgs) rows.push(['Co-organizers', coOrgs]);
    if (eventDetails.description) rows.push(['Description', eventDetails.description]);
    rows.push([]);
    rows.push(['Day', 'Session', 'Time', 'Type', 'Title', 'Church', 'Presenter', 'Description']);

    for (const item of allItems) {
      rows.push([
        String(item.day),
        item.session ?? '',
        item.time ?? '',
        item.type === 'SESSION_HEADER' ? 'Header' : 'Item',
        item.title,
        item.churchName ?? '',
        item.presenterName ?? '',
        item.description ?? '',
      ]);
    }

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle.replace(/\s+/g, '_')}_Program.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePDFClick() {
    setSelectedPrintDays(new Set(Array.from({ length: totalDays }, (_, i) => i + 1)));
    setPrintDialogOpen(true);
  }

  function togglePrintDay(day: number) {
    setSelectedPrintDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
  }

  async function exportToPDF(daysToExport: number[], pageSize: 'a4' | 'letter' | 'folio' | 'legal') {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    // ── Page size dimensions (mm) ─────────────────────────────────────────────
    const PAGE_DIMS: Record<string, [number, number]> = {
      a4:     [210,   297],
      letter: [215.9, 279.4],
      folio:  [215.9, 330.2],
      legal:  [215.9, 355.6],
    };
    const [pw, ph] = PAGE_DIMS[pageSize];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pw, ph] });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 13;

    // ── Color palette ─────────────────────────────────────────────────────────
    const darkBg: [number, number, number]  = [22, 22, 22];
    const tableHead: [number, number, number] = [55, 55, 55];
    const SESSION_PDF_COLORS: Record<ProgramSession, { bg: [number,number,number]; text: [number,number,number] }> = {
      MORNING:   { bg: [254, 243, 199], text: [120, 53, 15] },
      AFTERNOON: { bg: [255, 237, 213], text: [124, 45, 18] },
      EVENING:   { bg: [224, 231, 255], text: [49,  46, 129] },
    };

    // ── Compact Header ────────────────────────────────────────────────────────
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageW, 22, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(eventTitle.toUpperCase(), pageW / 2, 10, { align: 'center' });

    const dateRange = formatDateRange(eventDetails.startDate, eventDetails.endDate);
    const eventTypeFmt = eventType.replace(/_/g, ' ');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`${dateRange}  |  ${eventTypeFmt}`, pageW / 2, 17, { align: 'center' });

    let y = 27;

    // ── Compact Meta row ──────────────────────────────────────────────────────
    const hostOrgs = eventDetails.organizations.filter((o) => o.role === 'HOST').map((o) => o.name);
    const coOrgs   = eventDetails.organizations.filter((o) => o.role !== 'HOST').map((o) => o.name);

    const metaParts: string[] = [];
    if (eventDetails.venue)  metaParts.push(eventDetails.venue);
    if (hostOrgs.length)     metaParts.push(`Hosted by ${hostOrgs.join(', ')}`);
    if (coOrgs.length)       metaParts.push(`Co-org: ${coOrgs.join(', ')}`);

    if (metaParts.length) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      // Wrap long meta lines to stay within margins
      const metaLine = metaParts.join('   |   ');
      const wrapped = doc.splitTextToSize(metaLine, pageW - margin * 2) as string[];
      doc.text(wrapped, pageW / 2, y, { align: 'center' });
      y += wrapped.length * 4.5;
    }

    // Status + divider
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`Status: ${STATUS_CONFIG[status].label}`, pageW / 2, y, { align: 'center' });
    y += 4;

    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    // ── Program Table(s) ─────────────────────────────────────────────────────
    type CellObj = { content: string; colSpan?: number; styles?: Record<string, unknown> };
    type Cell = string | CellObj;

    const allItems = (program?.items ?? []).sort((a, b) => a.day - b.day || a.order - b.order);

    for (const day of daysToExport) {
      const items = allItems.filter((i) => i.day === day);
      if (!items.length) continue;

      if (isCamp) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 22, 22);
        doc.text(`Day ${day}`, margin, y);
        y += 4.5;
      }

      const tableBody: Cell[][] = [];

      for (const item of items) {
        if (item.type === 'SESSION_HEADER') {
          const key = item.session as ProgramSession | null;
          const colors = key ? SESSION_PDF_COLORS[key] : null;
          const label = key ? SESSION_CONFIG[key].label.toUpperCase() : item.title.toUpperCase();
          tableBody.push([{
            content: label,
            colSpan: 4,
            styles: {
              fontStyle: 'bold',
              halign: 'center',
              fillColor: colors?.bg ?? [235, 235, 235],
              textColor: colors?.text ?? [60, 60, 60],
              fontSize: 7,
              cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
            },
          }]);
        } else {
          const titleContent = item.description
            ? `${item.title}\n${item.description}`
            : item.title;
          tableBody.push([
            item.time ?? '',
            { content: titleContent, styles: { fontSize: item.description ? 7 : 7.5 } },
            item.churchName ?? '',
            item.presenterName ?? '',
          ]);
        }
      }

      // Proportional column widths based on usable page width
      const usable = pageW - margin * 2;
      autoTable(doc, {
        startY: y,
        head: [['Time', 'Title', 'Church', 'Presenter']],
        body: tableBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
          valign: 'middle',
          lineColor: [225, 225, 225],
          lineWidth: 0.2,
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: tableHead,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
        },
        alternateRowStyles: { fillColor: [249, 249, 249] },
        columnStyles: {
          0: { cellWidth: usable * 0.08, halign: 'center', textColor: [110, 110, 110] },
          1: { cellWidth: usable * 0.40 },
          2: { cellWidth: usable * 0.26 },
          3: { cellWidth: usable * 0.26 },
        },
        tableLineColor: [210, 210, 210],
        tableLineWidth: 0.25,
      });

      y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // ── Footer on every page ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const fh = doc.internal.pageSize.getHeight();
      doc.setFillColor(...darkBg);
      doc.rect(0, fh - 8, pageW, 8, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `${eventTitle}  |  ${STATUS_CONFIG[status].label}  |  Page ${i} of ${pageCount}`,
        pageW / 2,
        fh - 2.8,
        { align: 'center' },
      );
    }

    doc.save(`${eventTitle.replace(/\s+/g, '_')}_Program.pdf`);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => router.push('/events')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{eventTitle}</h1>
              <Badge variant="outline" className="text-xs capitalize">
                {eventType.replace('_', ' ').toLowerCase()}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', statusCfg.className)}>
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Program Builder</p>
          </div>
        </div>

        {/* Status selector + export buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <TourTrigger tourId="program" />
          <span className="text-xs text-muted-foreground">Status</span>
          <Select
            value={status}
            onValueChange={(v) => handleStatusChange(v as ProgramStatus)}
            disabled={isAnyPending}
            data-tour="program-status"
          >
            <SelectTrigger className="w-[130px] h-8 text-xs" data-tour="program-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FINAL">Final Program</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5" data-tour="program-export">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={exportToCSV}
              disabled={isAnyPending || !program}
            >
              <FileText className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handlePDFClick}
              disabled={isAnyPending || !program}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Day tabs — only for CAMP */}
      {isCamp && (
        <div className="flex items-center gap-2 flex-wrap" data-tour="program-day-tabs">
          {Array.from({ length: totalDays }, (_, i) => (
            <Button
              key={i + 1}
              variant={activeDay === i + 1 ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveDay(i + 1)}
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Day {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-primary"
            onClick={handleAddDay}
            disabled={isAnyPending || totalDays >= 30}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Day
          </Button>
          {totalDays > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={handleRemoveDay}
              disabled={isAnyPending}
            >
              Remove Day {totalDays}
            </Button>
          )}
        </div>
      )}

      {/* Session header buttons */}
      <div className="flex items-center gap-2 flex-wrap" data-tour="program-session-btns">
        <span className="text-xs text-muted-foreground">Add separator:</span>
        {(['MORNING', 'AFTERNOON', 'EVENING'] as ProgramSession[]).map((s) => {
          const cfg = SESSION_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className={cn('h-7 text-xs gap-1.5 border', cfg.className)}
              onClick={() => addSessionHeader(s)}
              disabled={isAnyPending}
            >
              <Icon className="h-3 w-3" />
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          );
        })}
      </div>

      {/* Program item list */}
      <div className="space-y-2" data-tour="program-item-list">
        {dayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed gap-2">
            <p className="text-sm text-muted-foreground">
              No items for {isCamp ? `Day ${activeDay}` : 'this program'} yet.
            </p>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { setEditingItem(null); setDialogOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              Add First Item
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dayItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {dayItems.map((item) =>
                  item.type === 'SESSION_HEADER' ? (
                    <SortableSessionHeaderRow
                      key={item.id}
                      item={item}
                      onDelete={() => setDeletingItemId(item.id)}
                      isPending={isAnyPending}
                    />
                  ) : (
                    <SortableProgramItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => { setEditingItem(item); setDialogOpen(true); }}
                      onDelete={() => setDeletingItemId(item.id)}
                      isPending={isAnyPending}
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add item button */}
      {dayItems.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-tour="program-add-item"
          onClick={() => { setEditingItem(null); setDialogOpen(true); }}
          disabled={isAnyPending}
        >
          {isCreatePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Item
        </Button>
      )}

      {/* Add / Edit dialog */}
      <ProgramItemDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingItem(null); }}
        onSubmit={handleItemSubmit}
        isPending={isCreatePending || isUpdatePending}
        editing={editingItem}
        churches={churches}
        totalDays={totalDays}
        defaultDay={activeDay}
      />

      {/* PDF export options dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Export PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Page size */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Page Size</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(['a4', 'letter', 'folio', 'legal'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPrintPageSize(size)}
                    className={cn(
                      'py-1.5 rounded-md border text-xs font-medium transition-colors capitalize',
                      printPageSize === size
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                    )}
                  >
                    {size === 'a4' ? 'A4' : size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Day selection — only for CAMP with multiple days */}
            {isCamp && totalDays > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Days to Include</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setSelectedPrintDays(new Set(Array.from({ length: totalDays }, (_, i) => i + 1)))}
                    >
                      All
                    </button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => setSelectedPrintDays(new Set())}
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                    const selected = selectedPrintDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => togglePrintDay(day)}
                        className={cn(
                          'px-3 py-1 rounded-md border text-xs font-medium transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                        )}
                      >
                        Day {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={isCamp && totalDays > 1 ? selectedPrintDays.size === 0 : false}
              onClick={() => {
                setPrintDialogOpen(false);
                const days = isCamp && totalDays > 1
                  ? Array.from(selectedPrintDays).sort((a, b) => a - b)
                  : [1];
                void exportToPDF(days, printPageSize);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingItemId} onOpenChange={(open: boolean) => { if (!open) setDeletingItemId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the program item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletePending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
