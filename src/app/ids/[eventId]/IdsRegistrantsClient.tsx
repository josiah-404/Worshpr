'use client';

import { type FC } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { IdRegistrant } from '@/types/id.types';

interface IdsRegistrantsClientProps {
  event: { id: string; title: string };
  registrants: IdRegistrant[];
  hasTemplate: boolean;
}

export const IdsRegistrantsClient: FC<IdsRegistrantsClientProps> = ({
  event, registrants, hasTemplate,
}) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/ids" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
          All Events
        </Link>
        <span className="text-border shrink-0">|</span>
        <p className="text-base font-semibold truncate">{event.title}</p>
      </div>
      <Button asChild className="gap-2 shrink-0">
        <Link href={`/ids/${event.id}/editor`}>
          <Pencil className="h-4 w-4" />
          {hasTemplate ? 'Edit Template & Generate' : 'Create ID Template'}
        </Link>
      </Button>
    </div>

    {/* Stats */}
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      <span>{registrants.length} approved registrant{registrants.length !== 1 ? 's' : ''}</span>
      {!hasTemplate && (
        <span className="ml-2 text-amber-500 text-xs">
          · Set up a template to generate IDs
        </span>
      )}
    </div>

    {/* Table */}
    {registrants.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg">
        <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No approved registrants yet</p>
      </div>
    ) : (
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Full Name</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Photo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrants.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {r.fullName[0]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{r.nickname ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.churchName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.divisionOrgName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">{r.confirmationCode}</TableCell>
                <TableCell>
                  {r.photoUrl ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <Camera className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">None</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
);
