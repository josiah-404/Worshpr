export type OrgMembershipRole = 'org_admin' | 'officer';

export interface OrgMembership {
  orgId: string;
  role: OrgMembershipRole;
  title: string | null;
}

export interface OrgMembershipWithName extends OrgMembership {
  orgName?: string;
}
