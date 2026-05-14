import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `REG-${code.slice(0, 4)}-${code.slice(4)}`;
}

const bulkRegistrantSchema = z.object({
  fullName:              z.string().min(1),
  email:                 z.string().email(),
  phone:                 z.string().min(1),
  birthday:              z.string().min(1),
  nickname:              z.string().optional(),
  address:               z.string().optional(),
  churchId:              z.string().optional(),
  divisionOrgId:         z.string().optional(),
  emergencyContactName:  z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  status:                z.enum(['APPROVED', 'PENDING']).default('APPROVED'),
  overwrite:             z.boolean().default(false),
});

const bulkRequestSchema = z.object({
  eventId:     z.string().min(1),
  registrants: z.array(bulkRegistrantSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bulkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventId, registrants } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizations: {
          where: { role: 'HOST', inviteStatus: 'ACCEPTED' },
          select: { orgId: true },
          take: 1,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hostOrgId = event.organizations[0]?.orgId;
    if (!hostOrgId) {
      return NextResponse.json({ error: 'Event has no host organization' }, { status: 500 });
    }

    const submittedByName  = session.user.name  ?? session.user.email ?? 'Admin';
    const submittedByEmail = session.user.email ?? '';

    type RowResult = {
      rowIndex:         number;
      fullName:         string;
      email:            string;
      outcome:          'success' | 'duplicate' | 'failed';
      confirmationCode?: string;
      error?:           string;
    };

    const results: RowResult[] = [];
    let imported = 0;
    let skipped  = 0;
    let failed   = 0;

    for (let i = 0; i < registrants.length; i++) {
      const r = registrants[i];

      try {
        const confirmationCode = generateConfirmationCode();

        await prisma.$transaction(async (tx) => {
          const registrant = await tx.registrant.upsert({
            where: { email: r.email },
            create: {
              fullName:             r.fullName,
              nickname:             r.nickname?.trim()  || null,
              email:                r.email,
              phone:                r.phone,
              birthday:             new Date(r.birthday),
              address:              r.address            || '',
              churchId:             r.churchId           || null,
              divisionOrgId:        r.divisionOrgId      || null,
              emergencyContactName: r.emergencyContactName  || '',
              emergencyContactPhone:r.emergencyContactPhone || '',
            },
            update: {
              fullName:             r.fullName,
              nickname:             r.nickname?.trim()  || null,
              phone:                r.phone,
              birthday:             new Date(r.birthday),
              address:              r.address            || '',
              churchId:             r.churchId           || null,
              divisionOrgId:        r.divisionOrgId      || null,
              emergencyContactName: r.emergencyContactName  || '',
              emergencyContactPhone:r.emergencyContactPhone || '',
            },
          });

          // Check for existing registration
          const existingReg = await tx.registration.findFirst({
            where: { eventId, registrantId: registrant.id },
            select: { id: true, group: { select: { confirmationCode: true } } },
          });

          if (existingReg && !r.overwrite) {
            throw new Error('DUPLICATE');
          }

          if (existingReg && r.overwrite) {
            // UPDATE the existing registration — no new group/record created
            await tx.registration.update({
              where: { id: existingReg.id },
              data: {
                status:       r.status,
                paymentIntent:'CASH',
                notes:        'Updated via bulk import',
                ...(r.status === 'APPROVED' ? {
                  approvedBy: session.user.id,
                  approvedAt: new Date(),
                } : {
                  approvedBy: null,
                  approvedAt: null,
                }),
              },
            });
            // Reuse the existing confirmation code
            Object.assign(r, { _existingCode: existingReg.group.confirmationCode });
          } else {
            // CREATE new group + registration
            const group = await tx.registrationGroup.create({
              data: {
                eventId,
                confirmationCode,
                submittedByName,
                submittedByEmail,
                headcount: 1,
              },
            });

            await tx.registration.create({
              data: {
                eventId,
                registrantId: registrant.id,
                groupId:      group.id,
                orgId:        hostOrgId,
                paymentIntent:'CASH',
                status:       r.status,
                ...(r.status === 'APPROVED' ? {
                  approvedBy: session.user.id,
                  approvedAt: new Date(),
                } : {}),
              },
            });
          }
        });

        results.push({
          rowIndex: i + 1,
          fullName:         r.fullName,
          email:            r.email,
          outcome:          'success',
          confirmationCode: (r as typeof r & { _existingCode?: string })._existingCode ?? confirmationCode,
        });
        imported++;
      } catch (err) {
        if (err instanceof Error && err.message === 'DUPLICATE') {
          results.push({
            rowIndex: i + 1,
            fullName: r.fullName,
            email:    r.email,
            outcome:  'duplicate',
            error:    'Already registered for this event',
          });
          skipped++;
        } else {
          results.push({
            rowIndex: i + 1,
            fullName: r.fullName,
            email:    r.email,
            outcome:  'failed',
            error:    err instanceof Error ? err.message : 'Unexpected error',
          });
          failed++;
        }
      }
    }

    return NextResponse.json({ data: { imported, skipped, failed, results } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to import registrants' }, { status: 500 });
  }
}
