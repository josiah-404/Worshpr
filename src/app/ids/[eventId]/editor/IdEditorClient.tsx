'use client';

import { type FC, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft, Upload, CheckCircle2, Loader2,
  FileDown, ChevronRight, Settings2, Layers, MousePointer2, Eye,
} from 'lucide-react';

const IdKonvaEditor = dynamic(
  () => import('@/components/ids/IdKonvaEditor').then((m) => m.IdKonvaEditor),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">Loading editor…</div> },
);
import { Button } from '@/components/ui/button';
import { useEdgeStore } from '@/lib/edgestore-client';
import { useSaveIdTemplate } from '@/hooks/useIdTemplate';
import { useExportIdsPdf } from '@/hooks/useExportIdsPdf';
import { IdSizeSelector } from '@/components/ids/IdSizeSelector';
import { IdLayoutPicker } from '@/components/ids/IdLayoutPicker';
import { IdColorThemePicker } from '@/components/ids/IdColorThemePicker';
import { IdTextColorPicker } from '@/components/ids/IdTextColorPicker';
import { IdFontPicker } from '@/components/ids/IdFontPicker';
import { IdCanvasPreview, SAMPLE_REGISTRANT } from '@/components/ids/IdCanvasPreview';
import { IdGenerateTable } from '@/components/ids/IdGenerateTable';
import { ID_LAYOUTS } from '@/lib/idLayouts';
import type { IdRegistrant, IdTemplateRecord, IdTemplateConfig, IdSizeId, LayoutFieldType, LayoutField } from '@/types/id.types';

const TEXT_FIELD_TYPES: LayoutFieldType[] = ['name', 'nickname', 'church', 'division', 'code'];
const FIELD_LABELS: Record<LayoutFieldType, string> = {
  name: 'Full Name', nickname: 'Nickname', church: 'Church',
  division: 'Division', code: 'Reg. Code',
  'gradient-overlay': '', 'rect-overlay': '', 'solid-band': '',
  'stripe-overlay': '', 'divider-line': '',
};

interface IdEditorClientProps {
  event: { id: string; title: string };
  initialTemplate: IdTemplateRecord | null;
  registrants: IdRegistrant[];
}

type Phase = 'configure' | 'generate';

export const IdEditorClient: FC<IdEditorClientProps> = ({
  event, initialTemplate, registrants,
}) => {
  const { edgestore } = useEdgeStore();
  const { mutate: saveTemplate, isPending: saving } = useSaveIdTemplate(event.id);
  const { exportPdf, exporting } = useExportIdsPdf();

  const [phase, setPhase] = useState<Phase>('configure');
  const [rightMode, setRightMode] = useState<'preview' | 'edit'>('preview');
  const [uploading, setUploading] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const defaultLayoutId = initialTemplate?.layoutId ?? 'gradient-bottom';
  const [config, setConfig] = useState<IdTemplateConfig>({
    backgroundUrl: initialTemplate?.backgroundUrl ?? '',
    sizeId: (initialTemplate?.sizeId as IdSizeId) ?? 'cr80',
    layoutId: defaultLayoutId,
    layoutFields: initialTemplate?.layoutFields ?? ID_LAYOUTS[defaultLayoutId]?.fields ?? [],
    overlayColor: initialTemplate?.overlayColor ?? '#000000',
    textColor: initialTemplate?.textColor ?? '#ffffff',
    fontFamily: initialTemplate?.fontFamily ?? 'Poppins',
  });

  function updateLayout(layoutId: string) {
    const layout = ID_LAYOUTS[layoutId];
    setConfig((c) => ({ ...c, layoutId, layoutFields: layout?.fields ?? c.layoutFields }));
  }

  function toggleField(fieldType: LayoutFieldType) {
    const isEnabled = config.layoutFields.some((f) => f.field === fieldType);
    if (isEnabled) {
      setConfig((c) => ({ ...c, layoutFields: c.layoutFields.filter((f) => f.field !== fieldType) }));
    } else {
      const fromPreset = ID_LAYOUTS[config.layoutId]?.fields.find((f) => f.field === fieldType);
      const toAdd: LayoutField = fromPreset ?? {
        field: fieldType, x: 0.5, y: 0.88, width: 0.80,
        align: 'center', fontSize: 0.042, bold: false,
      };
      setConfig((c) => ({ ...c, layoutFields: [...c.layoutFields, toAdd] }));
    }
  }

  function updateFieldFontSize(fieldType: LayoutFieldType, displayVal: number) {
    const fontSize = Math.max(0.010, Math.min(0.140, displayVal / 1000));
    setConfig((c) => ({
      ...c,
      layoutFields: c.layoutFields.map((f) =>
        f.field === fieldType ? { ...f, fontSize } : f,
      ),
    }));
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await edgestore.imgBucket.upload({
        file,
        options: { replaceTargetUrl: config.backgroundUrl || undefined },
      });
      setConfig((c) => ({ ...c, backgroundUrl: res.url }));
    } finally {
      setUploading(false);
      if (bgInputRef.current) bgInputRef.current.value = '';
    }
  }

  function handleSave() {
    saveTemplate({
      backgroundUrl: config.backgroundUrl,
      sizeId: config.sizeId,
      layoutId: config.layoutId,
      layoutFields: config.layoutFields as unknown as Record<string, unknown>[],
      overlayColor: config.overlayColor,
      textColor: config.textColor,
      fontFamily: config.fontFamily,
    });
  }

  function handleGoGenerate() {
    handleSave();
    setPhase('generate');
  }

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/ids/${event.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Registrants
          </Link>
          <span className="text-border shrink-0">|</span>
          <p className="text-base font-semibold truncate">{event.title} — ID Editor</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Phase tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setPhase('configure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                phase === 'configure'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configure
            </button>
            <button
              onClick={() => setPhase('generate')}
              disabled={!config.backgroundUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                phase === 'generate'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Generate
            </button>
          </div>

          {phase === 'configure' ? (
            <Button size="sm" className="gap-2" onClick={handleGoGenerate}
              disabled={!config.backgroundUrl || saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Save & Generate
            </Button>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => void exportPdf({
              registrants,
              backgroundUrl: config.backgroundUrl,
              sizeId: config.sizeId,
              fields: config.layoutFields,
              overlayColor: config.overlayColor,
              textColor: config.textColor,
              fontFamily: config.fontFamily,
              eventTitle: event.title,
            })} disabled={exporting || registrants.length === 0}>
              {exporting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting…</>
                : <><FileDown className="h-3.5 w-3.5" /> Export PDF ({registrants.length})</>}
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      {phase === 'configure' ? (
        <div className="flex gap-0 flex-1 min-h-0 overflow-hidden rounded-xl border border-border">
          {/* Left — inspector panel */}
          <div className="w-64 shrink-0 border-r border-border flex flex-col min-h-0">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border shrink-0">
              <p className="text-xs font-semibold text-foreground">Design</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Customize your ID template</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />

              {/* Background */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Background</p>
                {config.backgroundUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={config.backgroundUrl} alt="" className="h-9 w-14 rounded object-cover border border-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </p>
                      <button onClick={() => bgInputRef.current?.click()} disabled={uploading}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        Change image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => bgInputRef.current?.click()} disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border h-16 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                    {uploading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="text-[10px]">Uploading…</span></>
                      : <><Upload className="h-4 w-4" /><span className="text-[10px] font-medium">Upload PUBmat</span></>}
                  </button>
                )}
              </div>

              {/* Size */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">ID Size</p>
                <IdSizeSelector value={config.sizeId} onChange={(id) => setConfig((c) => ({ ...c, sizeId: id }))} />
              </div>

              {/* Layout */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Layout</p>
                <IdLayoutPicker value={config.layoutId} onChange={updateLayout} overlayColor={config.overlayColor} />
              </div>

              {/* Fields */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Fields</p>
                <div className="space-y-2">
                  {TEXT_FIELD_TYPES.map((fieldType) => {
                    const fieldData = config.layoutFields.find((f) => f.field === fieldType);
                    const enabled = !!fieldData;
                    const displaySize = Math.round((fieldData?.fontSize ?? 0.050) * 1000);

                    return (
                      <div key={fieldType} className={`rounded-lg border transition-colors ${enabled ? 'border-border bg-card' : 'border-border/40 bg-transparent'}`}>
                        {/* Field header row */}
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className={`text-xs font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                            {FIELD_LABELS[fieldType]}
                          </span>
                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleField(fieldType)}
                            className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                              enabled ? 'bg-primary' : 'bg-muted'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                              enabled ? 'translate-x-3' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Font size row — only when enabled */}
                        {enabled && (
                          <div className="px-3 pb-2.5 flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide w-12 shrink-0">Size</span>
                            <input
                              type="range"
                              min={15}
                              max={120}
                              step={1}
                              value={displaySize}
                              onChange={(e) => updateFieldFontSize(fieldType, Number(e.target.value))}
                              className="flex-1 h-1 accent-primary cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
                              {displaySize}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overlay Color */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Overlay Color</p>
                <IdColorThemePicker value={config.overlayColor} onChange={(hex) => setConfig((c) => ({ ...c, overlayColor: hex }))} />
              </div>

              {/* Text Color */}
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Text Color</p>
                <IdTextColorPicker value={config.textColor} onChange={(hex) => setConfig((c) => ({ ...c, textColor: hex }))} />
              </div>

              {/* Font */}
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Font</p>
                <IdFontPicker value={config.fontFamily} onChange={(id) => setConfig((c) => ({ ...c, fontFamily: id }))} />
              </div>
            </div>
          </div>

          {/* Right — preview or Konva drag editor */}
          <div className="flex-1 flex flex-col min-h-0 bg-muted/20">
            {/* Mode toggle header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                {rightMode === 'preview' ? 'Preview' : 'Drag Editor'}
              </p>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  onClick={() => setRightMode('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    rightMode === 'preview'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent/60'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
                <button
                  onClick={() => setRightMode('edit')}
                  disabled={!config.backgroundUrl}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    rightMode === 'edit'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent/60'
                  }`}
                >
                  <MousePointer2 className="h-3 w-3" />
                  Drag
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-4 overflow-y-auto">
              {rightMode === 'preview' ? (
                <>
                  <IdCanvasPreview
                    backgroundUrl={config.backgroundUrl}
                    sizeId={config.sizeId}
                    fields={config.layoutFields}
                    overlayColor={config.overlayColor}
                    textColor={config.textColor}
                    fontFamily={config.fontFamily}
                    registrant={SAMPLE_REGISTRANT}
                    previewWidth={320}
                  />
                  <p className="text-[10px] text-muted-foreground/40 tracking-wide mt-3">
                    Sample data — actual IDs use registrant info
                  </p>
                </>
              ) : (
                <div className="w-full max-w-md">
                  <IdKonvaEditor
                    backgroundUrl={config.backgroundUrl}
                    sizeId={config.sizeId}
                    fields={config.layoutFields}
                    overlayColor={config.overlayColor}
                    textColor={config.textColor}
                    fontFamily={config.fontFamily}
                    onChange={(newFields) => setConfig((c) => ({ ...c, layoutFields: newFields }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {registrants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No approved registrants to generate IDs for</p>
            </div>
          ) : (
            <IdGenerateTable
              registrants={registrants}
              backgroundUrl={config.backgroundUrl}
              sizeId={config.sizeId}
              fields={config.layoutFields}
              overlayColor={config.overlayColor}
              textColor={config.textColor}
              fontFamily={config.fontFamily}
            />
          )}
        </div>
      )}
    </div>
  );
};
