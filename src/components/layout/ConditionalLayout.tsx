"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const hideSidebar = pathname === "/login" || pathname === "/worship/present";

  if (hideSidebar) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
