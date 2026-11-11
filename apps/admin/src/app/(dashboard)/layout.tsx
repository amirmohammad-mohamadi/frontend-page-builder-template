import { Suspense } from "react";
import { SidebarInset, SidebarProvider, Skeleton } from "@components";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

/**
 * Every page in this group is rendered per operator, so nothing here is
 * prerendered at build time. The Suspense boundary lets pages read
 * `useSearchParams()` (list filters, pagination) without each one adding its own.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>{children}</Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
