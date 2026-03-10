'use client';

import { LayoutDashboard, Users, Monitor, Music2 } from 'lucide-react';

import { NavMain } from '@/components/layout/NavMain';
import { NavUser } from '@/components/layout/NavUser';
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

const navGroups = [
  {
    label: 'Home',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'User Management', url: '/users', icon: Users },
    ],
  },
  {
    label: 'Modules',
    items: [
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-500">
                  <Music2 className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">WorShipr</span>
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
