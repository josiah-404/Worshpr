'use client';

import { type FC } from 'react';
import Link from 'next/link';
import {
  CalendarDays, ClipboardList, LayoutList, Wallet, Church,
  Handshake, Monitor, Building2, Users, BookOpen, Play,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Guide } from '@/lib/guides';
import { TOUR_IDS, TOURS } from '@/lib/tours';
import type { TourId } from '@/lib/tours';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideCardProps {
  guide: Guide;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  CalendarDays,
  ClipboardList,
  LayoutList,
  Wallet,
  Church,
  Handshake,
  Monitor,
  Building2,
  Users,
  BookOpen,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const GuideCard: FC<GuideCardProps> = ({ guide }) => {
  const Icon = ICON_MAP[guide.icon] ?? BookOpen;
  const hasTour = (TOUR_IDS as string[]).includes(guide.slug);
  const tourDef = hasTour ? TOURS[guide.slug as TourId] : null;
  const tourPath = tourDef?.path ? `${tourDef.path}?tour=1` : null;
  const tourInPage = hasTour && !tourDef?.path;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base leading-tight">{guide.module}</p>
            {hasTour && (
              <p className="text-xs text-emerald-500 mt-0.5 font-medium">
                {tourInPage ? 'Tour available in-app' : 'Interactive tour available'}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {tourPath && (
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <Link href={tourPath}>
              <Play className="h-3.5 w-3.5" />
              Start Tour
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className={tourPath ? '' : 'w-full'}>
          <Link href={`/guides/${guide.slug}`}>Read Guide</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
