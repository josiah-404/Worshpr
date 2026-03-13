'use client';

import { type FC } from 'react';
import { Building2, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import type { Organization, OrganizationFormState } from '@/types';

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrg: Organization | null;
  form: OrganizationFormState;
  onFormChange: (form: OrganizationFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export const OrganizationDialog: FC<OrganizationDialogProps> = ({
  open,
  onOpenChange,
  editingOrg,
  form,
  onFormChange,
  onSubmit,
  loading,
  error,
}) => {
  const { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange } =
    useLogoUpload();

  const set = (patch: Partial<OrganizationFormState>) =>
    onFormChange({ ...form, ...patch });

  const isDisabled = loading || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingOrg ? 'Edit Organization' : 'Add New Organization'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 py-2">

          {/* ── Logo Upload ── */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileChange(e, form.logoUrl, (url) => set({ logoUrl: url }))}
          />

          <div className="flex flex-col items-center gap-3">
            {/* Avatar trigger */}
            <button
              type="button"
              disabled={uploading}
              onClick={triggerFilePicker}
              className={cn(
                'group relative flex h-24 w-24 items-center justify-center rounded-2xl',
                'border-2 border-dashed border-border bg-muted/40 overflow-hidden',
                'transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60',
              )}
            >
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              )}

              {/* Hover overlay */}
              {!uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus className="h-5 w-5 text-white" />
                  <span className="text-[10px] font-medium text-white">
                    {form.logoUrl ? 'Change' : 'Upload'}
                  </span>
                </div>
              )}

              {/* Progress overlay */}
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="text-[11px] font-semibold text-white">{uploadProgress}%</span>
                </div>
              )}
            </button>

            {/* Progress bar */}
            {uploading && (
              <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">
                {form.logoUrl ? 'Click logo to change' : 'Click to upload logo'}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                PNG, JPG, WEBP — max 4 MB
              </p>
            </div>

            {form.logoUrl && !uploading && (
              <button
                type="button"
                onClick={() => set({ logoUrl: '' })}
                className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="h-3 w-3" /> Remove logo
              </button>
            )}
          </div>

          {/* ── Name ── */}
          <FormField label="Organization Name" htmlFor="org-name">
            <Input
              id="org-name"
              required
              placeholder="e.g. Pearl Division - UFVC"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </FormField>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isDisabled} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {loading ? 'Saving...' : editingOrg ? 'Save Changes' : 'Add Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
