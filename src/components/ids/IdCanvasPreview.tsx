'use client';

import { type FC, useEffect, useRef, useCallback } from 'react';
import { drawId } from '@/lib/idCanvas';
import { ID_SIZES } from '@/lib/idSizes';
import type { LayoutField, IdRegistrant, IdSizeId } from '@/types/id.types';

interface IdCanvasPreviewProps {
  backgroundUrl: string;
  sizeId: IdSizeId;
  fields: LayoutField[];
  registrant?: IdRegistrant;
  overlayColor?: string;
  textColor?: string;
  fontFamily?: string;
  previewWidth?: number;
}

export const SAMPLE_REGISTRANT: IdRegistrant = {
  id: 'sample',
  fullName: 'Juan Dela Cruz',
  nickname: 'Juan',
  photoUrl: null,
  churchName: 'Sample Church',
  divisionOrgName: 'Youth Division',
  confirmationCode: 'REG-ABCD-1234',
};

export const IdCanvasPreview: FC<IdCanvasPreviewProps> = ({
  backgroundUrl,
  sizeId,
  fields,
  registrant = SAMPLE_REGISTRANT,
  overlayColor,
  textColor,
  fontFamily,
  previewWidth = 320,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    if (!canvasRef.current) return;
    const size = ID_SIZES[sizeId];
    if (!size) return;
    await drawId(canvasRef.current, { registrant, fields, backgroundUrl, size, overlayColor, textColor, fontFamily });
  }, [backgroundUrl, sizeId, fields, registrant, overlayColor, textColor, fontFamily]);

  useEffect(() => { void render(); }, [render]);

  const size = ID_SIZES[sizeId];
  const aspect = size ? size.widthPx / size.heightPx : 16 / 9;
  const previewHeight = Math.round(previewWidth / aspect);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-border shadow-md"
      style={{ width: previewWidth, height: previewHeight }}
    />
  );
};
