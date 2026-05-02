'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Flame,
  Monitor,
  Building2,
  LogOut,
  Settings,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

/* ── Nav structure ───────────────────────────────────────────── */
const ALL_NAV_GROUPS = [
  {
    label: 'Home',
    roles: ['super_admin', 'org_admin', 'officer'],
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['super_admin', 'org_admin', 'officer'],
      },
    ],
  },
  {
    label: 'Management',
    roles: ['super_admin', 'org_admin'],
    items: [
      {
        href: '/organizations',
        label: 'Organizations',
        icon: Building2,
        roles: ['super_admin'],
      },
      {
        href: '/users',
        label: 'User Management',
        icon: Users,
        roles: ['super_admin', 'org_admin'],
      },
    ],
  },
  {
    label: 'Modules',
    roles: ['super_admin', 'org_admin', 'officer'],
    items: [
      {
        href: '/worship',
        label: 'Worship Screen',
        icon: Monitor,
        roles: ['super_admin', 'org_admin', 'officer'],
      },
    ],
  },
];

/* ── Sidebar ─────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const role = session?.user?.role ?? 'officer';
  const navGroups = ALL_NAV_GROUPS.filter((g) => g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  const initials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  return (
    <aside className='flex h-screen w-[200px] shrink-0 flex-col bg-card border-r border-border'>
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className='flex items-center gap-2.5 px-4 h-14 border-b border-border'>
        <div className='flex h-6 w-6 items-center justify-center rounded-md bg-primary'>
          <Flame className='h-3.5 w-3.5 text-primary-foreground' />
        </div>
        <span className='text-sm font-semibold tracking-wide'>EMBR</span>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className='flex-1 overflow-y-auto px-2 py-3 space-y-4'>
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className='px-2 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest'>
              {group.label}
            </p>
            <div className='space-y-0.5'>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <span
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon className='h-4 w-4 shrink-0' />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom utilities ──────────────────────────────── */}
      <div className='border-t border-border px-2 py-3 space-y-0.5'>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className='flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors'
        >
          {theme === 'dark' ? (
            <>
              <Sun className='h-4 w-4 shrink-0' />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className='h-4 w-4 shrink-0' />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button className='flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors'>
          <Settings className='h-4 w-4 shrink-0' />
          <span>Settings</span>
        </button>

        <button className='flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors'>
          <HelpCircle className='h-4 w-4 shrink-0' />
          <span>Get Help</span>
        </button>
      </div>

      {/* ── User profile ──────────────────────────────────── */}
      <div className='border-t border-border px-2 py-3'>
        <div className='flex items-center gap-2.5 rounded-md px-2 py-1.5 group'>
          {/* Avatar */}
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold'>
            {initials}
          </div>

          {/* Name + email */}
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-medium truncate leading-tight'>
              {session?.user?.name ?? '—'}
            </p>
            <p className='text-[11px] text-muted-foreground truncate leading-tight'>
              {session?.user?.email ?? ''}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title='Sign out'
            className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive'
          >
            <LogOut className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>
    </aside>
  );
}
