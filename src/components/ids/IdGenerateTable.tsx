'use client';

import { type FC } from 'react';
import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { drawId } from '@/lib/idCanvas';
import { ID_SIZES } from '@/lib/idSizes';
import { IdCanvasPreview } from '@/components/ids/IdCanvasPreview';
import type { IdRegistrant, LayoutField, IdSizeId } from '@/types/id.types';

interface IdGenerateTableProps {
  registrants: IdRegistrant[];
  backgroundUrl: string;
  sizeId: IdSizeId;
  fields: LayoutField[];
  overlayColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export const IdGenerateTable: FC<IdGenerateTableProps> = ({
  registrants, backgroundUrl, sizeId, fields, overlayColor, textColor, fontFamily,
}) => {
  const [previewRegistrant, setPreviewRegistrant] = useState<IdRegistrant | null>(null);

  async function downloadSingle(registrant: IdRegistrant) {
    const size = ID_SIZES[sizeId];
    if (!size) return;
    const canvas = document.createElement('canvas');
    await drawId(canvas, { registrant, fields, backgroundUrl, size, overlayColor, textColor, fontFamily });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${registrant.fullName.replace(/\s+/g, '-').toLowerCase()}-id.png`;
    a.click();
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Code</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrants.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {r.fullName[0]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.churchName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.divisionOrgName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">{r.confirmationCode}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => setPreviewRegistrant(r)} title="Preview">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => void downloadSingle(r)} title="Download PNG">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Per-registrant preview dialog */}
      <Dialog open={!!previewRegistrant} onOpenChange={(o) => !o && setPreviewRegistrant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewRegistrant?.fullName}</DialogTitle>
          </DialogHeader>
          {previewRegistrant && (
            <div className="flex flex-col items-center gap-4">
              <IdCanvasPreview
                backgroundUrl={backgroundUrl}
                sizeId={sizeId}
                fields={fields}
                overlayColor={overlayColor}
                textColor={textColor}
                fontFamily={fontFamily}
                registrant={previewRegistrant}
                previewWidth={300}
              />
              <Button variant="outline" size="sm" className="gap-2 w-full"
                onClick={() => void downloadSingle(previewRegistrant)}>
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden QR for single downloads */}
      <div className="hidden" aria-hidden />
    </>
  );
};
