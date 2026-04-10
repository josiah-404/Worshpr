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
