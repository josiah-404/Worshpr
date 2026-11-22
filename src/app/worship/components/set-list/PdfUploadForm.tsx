'use client';

import { type ChangeEvent, type FC, useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePdfSlidesUpload } from '@/hooks/usePdfSlidesUpload';
import type { SongResult } from '@/types/worship.types';

interface PdfUploadFormProps {
  onAdd: (item: SongResult) => void;
  onBack: () => void;
}

export const PdfUploadForm: FC<PdfUploadFormProps> = ({ onAdd, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const { uploadPdf, isUploading, progress } = usePdfSlidesUpload();

  const progressLabel = !progress
    ? 'Uploading…'
    : progress.total === 0
      ? 'Opening PDF…'
      : `Page ${progress.uploaded} of ${progress.total} uploaded`;
  const progressPct = progress?.total ? Math.round((progress.uploaded / progress.total) * 100) : 0;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = ''; // allow re-picking the same file
    if (!picked) return;
    setFile(picked);
    if (!title.trim()) setTitle(picked.name.replace(/\.pdf$/i, ''));
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    try {
      const pages = await uploadPdf(file);
      onAdd({
        title: title.trim(),
        artist: `PDF · ${pages.length} page${pages.length === 1 ? '' : 's'}`,
        isDocument: true,
        pages,
      });
      toast.success('PDF added', { description: `${pages.length} slides added to the set list.` });
    } catch (err) {
      toast.error('PDF upload failed', {
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <input
        ref={fileInputRef}
        type='file'
        accept='application/pdf,.pdf'
        className='hidden'
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className='flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-4 text-center hover:bg-accent/30 hover:border-foreground/30 transition-colors disabled:opacity-50'
      >
        <FileUp className='h-5 w-5 text-muted-foreground' />
        <span className='text-xs font-medium truncate max-w-full'>
          {file ? file.name : 'Choose a PDF'}
        </span>
        <span className='text-[11px] text-muted-foreground'>
          PowerPoint / Keynote / Google Slides → export as PDF
        </span>
      </button>

      <input
        type='text'
        placeholder='Title (e.g. Sermon — Faith Over Fear) *'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isUploading}
        className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
      />

      {isUploading && (
        <div className='flex flex-col gap-1'>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
            <div className='h-full bg-primary transition-all' style={{ width: `${progressPct}%` }} />
          </div>
          <p className='text-[11px] text-muted-foreground'>{progressLabel}</p>
        </div>
      )}

      <p className='text-[11px] text-muted-foreground'>
        Each page becomes one slide. Animations and videos inside the slides are not kept.
      </p>

      <div className='flex items-center justify-end gap-2'>
        <button
          onClick={onBack}
          disabled={isUploading}
          className='rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40'
        >
          Back
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || !title.trim() || isUploading}
          className='inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
        >
          {isUploading && <Loader2 className='h-3 w-3 animate-spin' />}
          {isUploading ? 'Uploading…' : 'Upload & add'}
        </button>
      </div>
    </div>
  );
};
