'use client';

import { type FC } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2, UserPlus } from 'lucide-react';
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
import type { RegistrationGroupInput } from '@/validations/registration.schema';
import type { EventOrgOption } from '@/types';

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

// ─── Component ─────────────────────────────────────────────────────────────

interface RegistrantInfoStepProps {
  registrationType: 'individual' | 'group';
  eventOrgs: EventOrgOption[];
}

export const RegistrantInfoStep: FC<RegistrantInfoStepProps> = ({ registrationType, eventOrgs }) => {
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
      church: '',
      organization: '',
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`registrants.${index}.church`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Church <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Victory Alabang" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {eventOrgs.length > 0 && (
                <FormField
                  control={form.control}
                  name={`registrants.${index}.organization`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Organization <span className="text-muted-foreground">(optional)</span></FormLabel>
                      <Select onValueChange={f.onChange} value={f.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventOrgs.map((org) => (
                            <SelectItem key={org.orgId} value={org.orgName}>
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
            </div>
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
