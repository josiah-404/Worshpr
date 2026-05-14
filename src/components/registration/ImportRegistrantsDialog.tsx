'use client';

import { type FC, useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, Loader2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  parseExcelFile, validateRow, matchChurchByName, matchDivisionByName,
  downloadImportTemplate,
} from '@/lib/excelImport';
import { useBulkImportRegistration } from '@/hooks/useBulkImportRegistration';
import { useGetEventChurches } from '@/hooks/useGetEventChurches';
import { useGetChurches } from '@/hooks/useGetChurches';
import type { PreviewRow, DuplicateAction } from '@/lib/excelImport';
import type { BulkImportResult } from '@/hooks/useBulkImportRegistration';
import type { EventOrg } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'results';

interface ImportRegistrantsDialogProps {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  eventId:        string;
  eventTitle:     string;
  eventOrgs:      EventOrg[];
  existingEmails: Set<string>;
}

// ─── Row status chip ───────────────────────────────────────────────────────────

const RowChip: FC<{ row: PreviewRow }> = ({ row }) => {
  if (row.outcome === 'valid') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
        <CheckCircle2 className="h-3 w-3" /> Valid
      </span>
    );
  }
  if (row.outcome === 'duplicate') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500">
        <AlertTriangle className="h-3 w-3" /> Duplicate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
      <XCircle className="h-3 w-3" /> Error
    </span>
  );
};

// ─── Inline editable cell ──────────────────────────────────────────────────────

const EditableCell: FC<{
  value: string;
  hasError: boolean;
  onChange: (v: string) => void;
}> = ({ value, hasError, onChange }) => (
  <input
    className={cn(
      'w-full bg-transparent text-xs px-1 py-0.5 rounded focus:outline-none focus:ring-1',
      hasError ? 'ring-1 ring-destructive/60 focus:ring-destructive' : 'focus:ring-primary/60',
    )}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const ImportRegistrantsDialog: FC<ImportRegistrantsDialogProps> = ({
  open, onOpenChange, eventId, eventTitle, eventOrgs, existingEmails,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [results, setResults] = useState<BulkImportResult | null>(null);

  // All churches in the system — used for name matching
  const { data: allSystemChurches = [] } = useGetChurches();
  // Event-specific churches — used for the dropdown in the preview table
  const { data: churchData } = useGetEventChurches(eventId);
  const eventChurches = [
    ...(churchData?.participating ?? []),
    ...(churchData?.available ?? []),
  ];

  // Re-run name matching once system churches load (timing fix)
  useEffect(() => {
    if (step !== 'preview' || allSystemChurches.length === 0) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.churchId) return row; // already matched
        const matchedId = matchChurchByName(row.church, allSystemChurches);
        if (!matchedId) return row;
        return { ...row, churchId: matchedId };
      }),
    );
  }, [allSystemChurches.length, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: bulkImport, isPending: importing } = useBulkImportRegistration();

  // ── Counts ──────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    valid:     rows.filter((r) => r.outcome === 'valid').length,
    duplicate: rows.filter((r) => r.outcome === 'duplicate').length,
    error:     rows.filter((r) => r.outcome === 'error').length,
  }), [rows]);

  const unresolvedErrors    = rows.some((r) => r.outcome === 'error');
  const unresolvedDuplicates = rows.some((r) => r.outcome === 'duplicate' && r.duplicateAction === null);
  const canImport = !unresolvedErrors && !unresolvedDuplicates && rows.length > 0;

  // ── File processing ──────────────────────────────────────────────────────────

  async function processFile(file: File) {
    if (
      !file.name.match(/\.(xlsx|xls|csv)$/i) &&
      file.type !== 'text/csv' &&
      !file.type.includes('spreadsheet')
    ) {
      toast.error('Unsupported file type', { description: 'Please upload an .xlsx, .xls, or .csv file.' });
      return;
    }
    setParsing(true);
    try {
      const rawRows = await parseExcelFile(file);
      if (rawRows.length === 0) {
        toast.warning('No data found', { description: 'The file appears to be empty.' });
        return;
      }

      const preview: PreviewRow[] = rawRows.map((row) => {
        const withIds = {
          ...row,
          churchId:      matchChurchByName(row.church, allSystemChurches),
          divisionOrgId: matchDivisionByName(row.division, eventOrgs),
        };
        const errors = validateRow(withIds);
        const isDuplicate = !!withIds.email && existingEmails.has(withIds.email.toLowerCase());
        return {
          ...withIds,
          outcome:         errors.length > 0 ? 'error' : isDuplicate ? 'duplicate' : 'valid',
          errors,
          duplicateAction: isDuplicate ? null : null,
        };
      });

      setRows(preview);
      setStep('preview');
    } catch {
      toast.error('Failed to parse file', { description: 'Make sure the file is a valid Excel or CSV file.' });
    } finally {
      setParsing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  // ── Row editing ──────────────────────────────────────────────────────────────

  function updateRowField(idx: number, field: keyof PreviewRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value } as PreviewRow;

      if (field === 'church') {
        row.churchId = matchChurchByName(value, allSystemChurches);
      }
      if (field === 'division') {
        row.divisionOrgId = matchDivisionByName(value, eventOrgs);
      }

      // Re-validate after edit
      const errors = validateRow(row);
      const isDuplicate = !!row.email && existingEmails.has(row.email.toLowerCase());
      row.errors  = errors;
      row.outcome = errors.length > 0 ? 'error' : isDuplicate ? 'duplicate' : 'valid';
      next[idx] = row;
      return next;
    });
  }

  function updateRowChurchId(idx: number, churchId: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], churchId: churchId || undefined };
      return next;
    });
  }

  function updateRowDivisionOrgId(idx: number, orgId: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], divisionOrgId: orgId || undefined };
      return next;
    });
  }

  function setDuplicateAction(idx: number, action: DuplicateAction) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], duplicateAction: action };
      return next;
    });
  }

  function setAllDuplicates(action: DuplicateAction) {
    setRows((prev) =>
      prev.map((r) => r.outcome === 'duplicate' ? { ...r, duplicateAction: action } : r),
    );
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  function handleImport() {
    const toImport = rows.filter(
      (r) => r.outcome === 'valid' || (r.outcome === 'duplicate' && r.duplicateAction === 'overwrite'),
    );

    bulkImport(
      {
        eventId,
        registrants: toImport.map((r) => ({
          fullName:             r.fullName,
          email:                r.email,
          phone:                r.phone,
          birthday:             r.birthday,
          nickname:             r.nickname,
          address:              r.address,
          churchId:             r.churchId,
          divisionOrgId:        r.divisionOrgId,
          emergencyContactName: r.emergencyContactName,
          emergencyContactPhone:r.emergencyContactPhone,
          status:               r.status,
          overwrite:            r.outcome === 'duplicate' && r.duplicateAction === 'overwrite',
        })),
      },
      {
        onSuccess: (data) => {
          setResults(data);
          setStep('results');
        },
        onError: (err) => {
          toast.error('Import failed', { description: err.message });
        },
      },
    );
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function handleClose() {
    setStep('upload');
    setRows([]);
    setResults(null);
    onOpenChange(false);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Import Registrants
          </DialogTitle>
          <DialogDescription>
            Adding to <span className="font-medium text-foreground">{eventTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-[10px] shrink-0 pb-1">
          {(['upload', 'preview', 'results'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              <span className={cn(
                'font-semibold uppercase tracking-wider',
                step === s ? 'text-primary' : 'text-muted-foreground/40',
              )}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="shrink-0" />

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed h-40 cursor-pointer transition-colors',
                dragging
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30',
              )}
            >
              {parsing ? (
                <><Loader2 className="h-8 w-8 animate-spin" /><p className="text-sm">Parsing…</p></>
              ) : (
                <>
                  <Upload className="h-8 w-8" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop your Excel file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-0.5">.xlsx, .xls, or .csv</p>
                  </div>
                </>
              )}
            </div>

            {/* Format guide */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Expected columns</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                {[
                  ['Full Name', 'required'],
                  ['Email', 'required'],
                  ['Phone', 'required'],
                  ['Birthday', 'required · YYYY-MM-DD'],
                  ['Nickname', 'optional'],
                  ['Address', 'optional'],
                  ['Church', 'optional · matched by name'],
                  ['Division', 'optional · matched by name'],
                  ['Emergency Contact Name', 'optional'],
                  ['Emergency Contact Phone', 'optional'],
                  ['Status', 'optional · APPROVED or PENDING'],
                ].map(([col, hint]) => (
                  <div key={col} className="flex items-baseline gap-1">
                    <span className="font-medium text-foreground">{col}</span>
                    <span className="text-muted-foreground/60">— {hint}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download template */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-start"
              onClick={() => void downloadImportTemplate()}
            >
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Summary bar */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <span className="text-xs text-emerald-500 font-semibold">{counts.valid} valid</span>
              <span className="text-xs text-amber-500 font-semibold">{counts.duplicate} duplicate{counts.duplicate !== 1 ? 's' : ''}</span>
              <span className="text-xs text-destructive font-semibold">{counts.error} error{counts.error !== 1 ? 's' : ''}</span>
              {counts.duplicate > 0 && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Duplicates:</span>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => setAllDuplicates('skip')}>Skip All</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => setAllDuplicates('overwrite')}>Overwrite All</Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-lg border border-border min-h-0">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Status</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Full Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Email</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Phone</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Birthday</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Church</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Division</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Import As</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const errorFields = new Set(
                      row.errors.map((e) => {
                        if (e.includes('Full Name')) return 'fullName';
                        if (e.includes('Email')) return 'email';
                        if (e.includes('Phone')) return 'phone';
                        if (e.includes('Birthday')) return 'birthday';
                        return '';
                      }),
                    );

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          'border-t border-border/50',
                          row.outcome === 'error'     && 'bg-destructive/5',
                          row.outcome === 'duplicate' && 'bg-amber-500/5',
                        )}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.rowIndex}</td>
                        <td className="px-2 py-1.5"><RowChip row={row} /></td>
                        <td className="px-2 py-1.5 min-w-[120px]">
                          <EditableCell
                            value={row.fullName}
                            hasError={errorFields.has('fullName')}
                            onChange={(v) => updateRowField(idx, 'fullName', v)}
                          />
                        </td>
                        <td className="px-2 py-1.5 min-w-[140px]">
                          <EditableCell
                            value={row.email}
                            hasError={errorFields.has('email')}
                            onChange={(v) => updateRowField(idx, 'email', v)}
                          />
                        </td>
                        <td className="px-2 py-1.5 min-w-[100px]">
                          <EditableCell
                            value={row.phone}
                            hasError={errorFields.has('phone')}
                            onChange={(v) => updateRowField(idx, 'phone', v)}
                          />
                        </td>
                        <td className="px-2 py-1.5 min-w-[100px]">
                          <EditableCell
                            value={row.birthday}
                            hasError={errorFields.has('birthday')}
                            onChange={(v) => updateRowField(idx, 'birthday', v)}
                          />
                        </td>
                        {/* Church dropdown */}
                        <td className="px-2 py-1.5 min-w-[140px]">
                          <div className="space-y-0.5">
                            <Select
                              value={row.churchId ?? 'none'}
                              onValueChange={(v) => updateRowChurchId(idx, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="— None —" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— None —</SelectItem>
                                {(eventChurches.length > 0 ? eventChurches : allSystemChurches).map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {row.church && !row.churchId && (
                              <p className="text-[9px] text-amber-500 truncate" title={row.church}>
                                Unmatched: {row.church}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Division dropdown */}
                        <td className="px-2 py-1.5 min-w-[140px]">
                          <div className="space-y-0.5">
                            <Select
                              value={row.divisionOrgId ?? 'none'}
                              onValueChange={(v) => updateRowDivisionOrgId(idx, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="— None —" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— None —</SelectItem>
                                {eventOrgs.map((o) => (
                                  <SelectItem key={o.orgId} value={o.orgId}>{o.orgName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {row.division && !row.divisionOrgId && (
                              <p className="text-[9px] text-amber-500 truncate" title={row.division}>
                                Unmatched: {row.division}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <Badge variant="outline" className={cn(
                            'text-[9px]',
                            row.status === 'APPROVED'
                              ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10',
                          )}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5">
                          {row.outcome === 'duplicate' && (
                            <Select
                              value={row.duplicateAction ?? ''}
                              onValueChange={(v) => setDuplicateAction(idx, v as DuplicateAction)}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-24">
                                <SelectValue placeholder="Choose…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">Skip</SelectItem>
                                <SelectItem value="overwrite">Overwrite</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {row.outcome === 'error' && (
                            <div className="text-[10px] text-destructive space-y-0.5">
                              {row.errors.map((e, i) => <p key={i}>{e}</p>)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                {(unresolvedErrors || unresolvedDuplicates) && (
                  <p className="text-[10px] text-muted-foreground">
                    {unresolvedErrors && 'Fix all errors. '}
                    {unresolvedDuplicates && 'Resolve all duplicates.'}
                  </p>
                )}
                <Button onClick={handleImport} disabled={!canImport || importing}>
                  {importing
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</>
                    : `Import ${rows.filter((r) => r.outcome === 'valid' || (r.outcome === 'duplicate' && r.duplicateAction === 'overwrite')).length} Registrants`
                  }
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Results ── */}
        {step === 'results' && results && (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Imported',    value: results.imported, className: 'text-emerald-500' },
                { label: 'Skipped',     value: results.skipped,  className: 'text-amber-500' },
                { label: 'Failed',      value: results.failed,   className: 'text-destructive' },
              ].map(({ label, value, className }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                  <p className={cn('text-2xl font-bold', className)}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Result rows */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Result</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-2 font-medium">{r.fullName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                      <td className="px-3 py-2">
                        {r.outcome === 'success' && (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Imported
                          </span>
                        )}
                        {r.outcome === 'duplicate' && (
                          <span className="text-amber-500 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Skipped
                          </span>
                        )}
                        {r.outcome === 'failed' && (
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> {r.error}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                        {r.confirmationCode ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button className="self-end" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
