import type { PaginatedMeta } from '@/types';

export interface Church {
  id: string;
  orgId: string;
  orgName: string;
  name: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchOption {
  id: string;
  name: string;
  orgName: string;
  orgId: string;
}

export interface PaginatedChurchesResponse {
  data: Church[];
  meta: PaginatedMeta;
}

export interface GetChurchesListParams {
  orgId?: string;
  page?: number;
  page_size?: number;
  query?: string;
  status?: 'all' | 'active' | 'inactive';
}
