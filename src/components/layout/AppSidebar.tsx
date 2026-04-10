'use client';

import { LayoutDashboard, Users, Monitor, Flame, Building2, CalendarDays, Handshake, ClipboardList, Wallet, Church } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { NavMain } from '@/components/layout/NavMain';
import { NavUser } from '@/components/layout/NavUser';
import { useCollaborationBadge } from '@/hooks/useCollaborationBadge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const ALL_NAV_GROUPS = [
  {
    label: 'Home',
    roles: ['super_admin', 'org_admin', 'officer'],
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    roles: ['super_admin', 'org_admin'],
    items: [
      { title: 'Organizations', url: '/organizations', icon: Building2, roles: ['super_admin'] },
      { title: 'User Management', url: '/users', icon: Users, roles: ['super_admin', 'org_admin'] },
      { title: 'Churches', url: '/churches', icon: Church, roles: ['super_admin', 'org_admin'] },
    ],
  },
  {
    label: 'Modules',
    roles: ['super_admin', 'org_admin', 'officer'],
    items: [
      { title: 'Events', url: '/events', icon: CalendarDays },
      { title: 'Registrations', url: '/registrations', icon: ClipboardList, roles: ['super_admin', 'org_admin'] },
      { title: 'Finance', url: '/finance', icon: Wallet, roles: ['super_admin', 'org_admin'] },
      { title: 'Collaborations', url: '/collaborations', icon: Handshake, roles: ['org_admin'] },
      {
        title: 'Worship Screen',
        url: '/worship',
        icon: Monitor,
        items: [
          { title: 'Presentations', url: '/worship' },
          { title: 'Editor', url: '/worship/editor' },
        ],
      },
    ],
  },
];

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? 'officer';
  const title = session?.user?.title ?? '';
  const collaborationBadge = useCollaborationBadge();
  const isTreasurer = role === 'officer' && title === 'Treasurer';

  const navGroups = ALL_NAV_GROUPS
    .filter((g) => g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => {
          if (!('roles' in item)) return true;
          const roles = item.roles as string[];
          if (roles.includes(role)) return true;
          // Treasurer officers can see Finance
          if (item.title === 'Finance' && isTreasurer) return true;
          return false;
        })
        .map((item) => ({
          ...item,
          badge: item.title === 'Collaborations' ? collaborationBadge : undefined,
        })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary">
                  <Flame className="size-4 text-primary-foreground" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-wide">EMBR</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Worship App
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
