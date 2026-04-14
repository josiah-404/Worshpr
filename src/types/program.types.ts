export type ProgramStatus = 'DRAFT' | 'PENDING' | 'FINAL';
export type ProgramSession = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type ProgramItemType = 'SESSION_HEADER' | 'ITEM';

export interface ProgramItemData {
  id: string;
  programId: string;
  day: number;
  type: ProgramItemType;
  session: ProgramSession | null;
  order: number;
  title: string;
  description: string | null;
  time: string | null;
  churchId: string | null;
  churchName: string | null;
  presenterName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventProgramData {
  id: string;
  eventId: string;
  status: ProgramStatus;
  totalDays: number;
  items: ProgramItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramItemPayload {
  day: number;
  type: ProgramItemType;
  session?: ProgramSession;
  title: string;
  description?: string;
  time?: string;
  churchId?: string;
  presenterName?: string;
}

export interface UpdateProgramItemPayload {
  title?: string;
  description?: string | null;
  time?: string | null;
  churchId?: string | null;
  presenterName?: string | null;
  session?: ProgramSession | null;
  day?: number;
}

export interface UpsertProgramPayload {
  status?: ProgramStatus;
  totalDays?: number;
}

export interface EventDetails {
  venue: string | null;
  startDate: string;
  endDate: string;
  description: string | null;
  organizations: Array<{ name: string; role: string }>;
}
