"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import { OrgBar } from "@/components/layout/OrgBar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { EdgeStoreProvider } from "@/lib/edgestore-client";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

function IdleGuard() {
  useIdleTimeout();
  return null;
}

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login" || pathname === "/worship/present";

  if (hideSidebar) return <>{children}</>;

  return (
    <EdgeStoreProvider>
      <IdleGuard />
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <OrgBar />
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </EdgeStoreProvider>
  );
}
