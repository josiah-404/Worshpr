'use client';

import { type FC, useRef, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2, UserPlus, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEdgeStore } from '@/lib/edgestore-client';
import type { RegistrationGroupInput } from '@/validations/registration.schema';
import type { ChurchOption, EventOrgOption } from '@/types';

// ─── PhotoUploadField ──────────────────────────────────────────────────────

interface PhotoUploadFieldProps {
  index: number;
}

const PhotoUploadField: FC<PhotoUploadFieldProps> = ({ index }) => {
  const { edgestore } = useEdgeStore();
  const form = useFormContext<RegistrationGroupInput>();
  const photoUrl = useWatch({ control: form.control, name: `registrants.${index}.photoUrl` }) as string | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await edgestore.imgBucket.upload({
        file,
        options: { replaceTargetUrl: photoUrl || undefined },
      });
      form.setValue(`registrants.${index}.photoUrl`, res.url);
    } catch {
      // silent retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">
        Photo <span className="text-xs text-primary font-normal ml-1">Recommended for ID</span>
      </p>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {photoUrl ? (
        <div className="flex items-center gap-3">
          <img src={photoUrl} alt="registrant photo" className="h-16 w-16 rounded-md object-cover border border-border" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Photo uploaded
            </div>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              Change
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-2 w-full border-dashed"
          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            : <><Camera className="h-4 w-4" /> Upload 1×1 or 2×2 Photo</>}
        </Button>
      )}
    </div>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function calculateAge(birthday: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

interface AgeDisplayProps {
  index: number;
}

const AgeDisplay: FC<AgeDisplayProps> = ({ index }) => {
  const birthday = useWatch({ name: `registrants.${index}.birthday` }) as string;
  const age = calculateAge(birthday);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">Age</label>
      <Input
        disabled
        value={age !== null ? `${age} yrs old` : ''}
        placeholder="Auto-calculated"
        className="bg-muted/50 text-muted-foreground"
      />
    </div>
  );
};

// ─── DivisionChurchFields ──────────────────────────────────────────────────

interface DivisionChurchFieldsProps {
  index: number;
  eventOrgs: EventOrgOption[];
  churches: ChurchOption[];
}

const DivisionChurchFields: FC<DivisionChurchFieldsProps> = ({ index, eventOrgs, churches }) => {
  const form = useFormContext<RegistrationGroupInput>();
  const divisionOrgId = useWatch({ control: form.control, name: `registrants.${index}.divisionOrgId` }) as string;

  const filteredChurches = divisionOrgId
    ? churches.filter((c) => c.orgId === divisionOrgId)
    : churches;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {eventOrgs.length > 0 && (
        <FormField
          control={form.control}
          name={`registrants.${index}.divisionOrgId`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Division <span className="text-muted-foreground">(optional)</span></FormLabel>
              <Select
                onValueChange={(v) => {
                  f.onChange(v === 'none' ? '' : v);
                  // Reset church when division changes
                  form.setValue(`registrants.${index}.churchId`, '');
                }}
                value={f.value ?? ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a division" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {eventOrgs.map((org) => (
                    <SelectItem key={org.orgId} value={org.orgId}>
                      {org.orgName}
                      {org.role === 'HOST' && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(Host)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {filteredChurches.length > 0 && (
        <FormField
          control={form.control}
          name={`registrants.${index}.churchId`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Church <span className="text-muted-foreground">(optional)</span></FormLabel>
              <Select
                onValueChange={(v) => f.onChange(v === 'none' ? '' : v)}
                value={f.value ?? ''}
                disabled={eventOrgs.length > 0 && !divisionOrgId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      eventOrgs.length > 0 && !divisionOrgId
                        ? 'Select a division first'
                        : 'Select a church'
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {filteredChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────

interface RegistrantInfoStepProps {
  registrationType: 'individual' | 'group';
  eventOrgs: EventOrgOption[];
  churches: ChurchOption[];
}

export const RegistrantInfoStep: FC<RegistrantInfoStepProps> = ({ registrationType, eventOrgs, churches }) => {
  const form = useFormContext<RegistrationGroupInput>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'registrants',
  });

  function addRegistrant() {
    append({
      fullName: '',
      nickname: '',
      email: '',
      phone: '',
      birthday: '',
      address: '',
      photoUrl: '',
      churchId: '',
      divisionOrgId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
  }

  return (
    <div className="space-y-4">
      {/* Registrant cards */}
      {fields.map((field, index) => (
        <Card key={field.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Registrant {index + 1}
              </CardTitle>
              {registrationType === 'group' && fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`registrants.${index}.fullName`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan dela Cruz" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`registrants.${index}.nickname`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Nickname <span className="text-muted-foreground">(for ID)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`registrants.${index}.email`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@example.com" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`registrants.${index}.phone`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="09XX XXX XXXX" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`registrants.${index}.birthday`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <Input type="date" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AgeDisplay index={index} />
            </div>
            <FormField
              control={form.control}
              name={`registrants.${index}.address`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Street, Barangay, City, Province"
                      className="resize-none"
                      rows={2}
                      {...f}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PhotoUploadField index={index} />
            <DivisionChurchFields index={index} eventOrgs={eventOrgs} churches={churches} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`registrants.${index}.emergencyContactName`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria dela Cruz" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`registrants.${index}.emergencyContactPhone`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="09XX XXX XXXX" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {registrationType === 'group' && (
        <Button type="button" variant="outline" className="w-full gap-2" onClick={addRegistrant}>
          <Plus className="h-4 w-4" />
          <UserPlus className="h-4 w-4" />
          Add Another Registrant
        </Button>
      )}
    </div>
  );
};
