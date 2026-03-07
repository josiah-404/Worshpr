export type UserRole = 'ADMIN' | 'MEDIA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserFormState {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface Presentation {
  id: string;
  title: string;
  lyrics: string;
  bgId: string;
  transitionId: string;
  fontId: string;
  sizeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSearchQuotaRecord {
  used: number;
  limit: number;
  remaining: number;
  date: string;
}
