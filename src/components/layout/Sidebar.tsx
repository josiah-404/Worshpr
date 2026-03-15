"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Music2,
  Monitor,
  LogOut,
  Settings,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

/* ── Nav structure ───────────────────────────────────────────── */
const navGroups = [
  {
    label: "Home",
    items: [
      { href: "/",      label: "Dashboard",       icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/users", label: "User Management", icon: Users },
    ],
  },
  {
    label: "Modules",
    items: [
      { href: "/worship", label: "Worship Screen", icon: Monitor },
    ],
  },
];

/* ── Sidebar ─────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname        = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  return (
    <aside className="flex h-screen w-[200px] shrink-0 flex-col bg-card border-r border-border">

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500">
          <Music2 className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Wor<span className="text-indigo-400">Shipr</span>
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <span
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
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
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
        >
          {theme === "dark"
            ? <><Sun className="h-4 w-4 shrink-0" /><span>Light Mode</span></>
            : <><Moon className="h-4 w-4 shrink-0" /><span>Dark Mode</span></>
          }
        </button>

        <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors">
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </button>

        <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors">
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>Get Help</span>
        </button>
      </div>

      {/* ── User profile ──────────────────────────────────── */}
      <div className="border-t border-border px-2 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 group">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
            {initials}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight">
              {session?.user?.name ?? "—"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {session?.user?.email ?? ""}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}
