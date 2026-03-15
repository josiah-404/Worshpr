export type EventType = 'camp' | 'fellowship' | 'seminar';
export type EventStatus = 'draft' | 'open' | 'closed' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  orgId: string;
  theme: string;
  description: string | null;
  type: EventType;
  venue: string | null;
  isOngoing: boolean;
  isOpen: boolean;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  registrationFee: number;
  maxSlots: number | null;
  status: EventStatus;
  coverImageUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count: { registrations: number };
}

export interface EventFormValues {
  orgId: string;
  theme: string;
  description: string;
  type: EventType;
  venue: string;
  isOngoing: boolean;
  isOpen: boolean;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationFee: number;
  maxSlots: string;
  status: EventStatus;
  coverImageUrl: string;
}
