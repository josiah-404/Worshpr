'use client';

import { useRef, useState } from 'react';
import { useEdgeStore } from '@/lib/edgestore-client';

interface UseLogoUploadResult {
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  uploadProgress: number;
  triggerFilePicker: () => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    currentUrl: string,
    onSuccess: (url: string) => void,
  ) => Promise<void>;
}

export function useLogoUpload(): UseLogoUploadResult {
  const { edgestore } = useEdgeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    currentUrl: string,
    onSuccess: (url: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await edgestore.imgBucket.upload({
        file,
        onProgressChange: (p) => setUploadProgress(p),
        options: { replaceTargetUrl: currentUrl || undefined },
      });
      onSuccess(res.url);
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return { fileInputRef, uploading, uploadProgress, triggerFilePicker, handleFileChange };
}
