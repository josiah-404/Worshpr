'use client';

import { type FC, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RemoteControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null until the realtime channel token is minted for this presentation. */
  remoteUrl: string | null;
  connectedCount: number;
}

export const RemoteControlDialog: FC<RemoteControlDialogProps> = ({
  open,
  onOpenChange,
  remoteUrl,
  connectedCount,
}) => {
  const [copied, setCopied] = useState(false);
  const hasConnections = connectedCount > 0;
  const connectionLabel = hasConnections
    ? `${connectedCount} phone${connectedCount === 1 ? '' : 's'} connected`
    : 'Waiting for a phone to connect…';

  const handleCopy = async () => {
    if (!remoteUrl) return;
    try {
      await navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Copy failed', {
        description: err instanceof Error ? err.message : 'Could not access the clipboard.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            Phone Remote
          </DialogTitle>
          <DialogDescription>
            Scan with your phone camera to control the slides. The link only works while this
            presentation is live. Anyone with it can change slides, so don&apos;t share it.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4'>
          <div className='rounded-xl bg-white p-4'>
            {remoteUrl ? (
              <QRCodeSVG value={remoteUrl} size={200} bgColor='#ffffff' fgColor='#000000' />
            ) : (
              <div className='h-[200px] w-[200px] animate-pulse rounded bg-muted' />
            )}
          </div>

          <p
            className={cn(
              'flex items-center gap-2 text-sm',
              hasConnections ? 'text-green-500' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                hasConnections ? 'bg-green-500' : 'bg-muted-foreground/40 animate-pulse',
              )}
            />
            {connectionLabel}
          </p>

          <Button variant='outline' className='w-full gap-2' disabled={!remoteUrl} onClick={handleCopy}>
            {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
