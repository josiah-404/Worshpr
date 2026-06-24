'use client';

import { type FC } from 'react';
import Image from 'next/image';
import { Building2, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetOrganizations } from '@/hooks/useGetOrganizations';
import { useOrgContext } from '@/providers/OrgContext';

function OrgAvatar({ logoUrl, name, size = 24 }: { logoUrl: string | null; name: string; size?: number }) {
  if (logoUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="relative rounded-md overflow-hidden shrink-0"
      >
        <Image src={logoUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-md bg-primary/20 flex items-center justify-center shrink-0"
    >
      <Building2 className="h-3 w-3 text-primary" />
    </div>
  );
}

export const OrgBar: FC = () => {
  const { data: session } = useSession();
  const { activeOrgId, setActiveOrgId, canSwitchOrg } = useOrgContext();
  const { data: organizations = [] } = useGetOrganizations();

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;
  const memberships = session?.user?.orgMemberships ?? [];

  const selectableOrgs = isSuperAdmin
    ? organizations
    : organizations.filter((o) => memberships.some((m) => m.orgId === o.id));

  const activeOrg = selectableOrgs.find((o) => o.id === activeOrgId) ?? null;

  if (canSwitchOrg) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent/60 transition-colors focus:outline-none">
            {activeOrg ? (
              <>
                <OrgAvatar logoUrl={activeOrg.logoUrl} name={activeOrg.name} size={20} />
                <span className="font-medium truncate max-w-40">{activeOrg.name}</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">All organizations</span>
              </>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onSelect={() => setActiveOrgId(null)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className={activeOrgId === null ? 'font-medium' : ''}>All organizations</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {selectableOrgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => setActiveOrgId(org.id)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <OrgAvatar logoUrl={org.logoUrl} name={org.name} size={20} />
              <span className={org.id === activeOrgId ? 'font-medium' : ''}>{org.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!activeOrg) return null;

  return (
    <div className="flex items-center gap-2.5">
      <OrgAvatar logoUrl={activeOrg.logoUrl} name={activeOrg.name} size={28} />
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">Organization</p>
        <p className="text-sm font-semibold text-foreground truncate max-w-48">
          {activeOrg.name}
        </p>
      </div>
    </div>
  );
};
