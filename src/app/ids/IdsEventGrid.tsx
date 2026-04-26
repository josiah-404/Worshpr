'use client';

import { type FC } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, IdCard, CheckCircle2, Monitor } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EventCardItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImage: string | null;
  hasTemplate: boolean;
  approvedCount: number;
}

interface IdsEventGridProps {
  events: EventCardItem[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_GRADIENT: Record<string, string> = {
  CAMP: 'from-amber-500 to-orange-600',
  FELLOWSHIP: 'from-blue-500 to-indigo-600',
  SEMINAR: 'from-violet-500 to-purple-600',
  WORSHIP_NIGHT: 'from-rose-500 to-pink-600',
};

export const IdsEventGrid: FC<IdsEventGridProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-lg">
        <IdCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No events found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create an event with approved registrants to generate IDs
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {events.map((event) => (
        <Card key={event.id} className="flex flex-col overflow-hidden border-border/60">
          {/* Cover */}
          <div className="relative h-24">
            {event.coverImage ? (
              <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', TYPE_GRADIENT[event.type] ?? 'from-gray-500 to-gray-600')}>
                <Monitor className="h-8 w-8 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {event.hasTemplate && (
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Template set
                </span>
              </div>
            )}
          </div>

          <CardContent className="flex-1 px-4 pt-3 pb-2 space-y-2">
            <p className="font-semibold text-sm leading-snug line-clamp-2">{event.title}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDate(event.startDate)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              {event.approvedCount} approved registrant{event.approvedCount !== 1 ? 's' : ''}
            </div>
          </CardContent>

          <CardFooter className="px-4 pb-4 pt-0">
            <Button asChild size="sm" className="w-full gap-2" disabled={event.approvedCount === 0}>
              <Link href={`/ids/${event.id}`}>
                <IdCard className="h-3.5 w-3.5" />
                {event.approvedCount === 0 ? 'No Approved Registrants' : 'Open'}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
