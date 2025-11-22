import type { Metadata } from "next";
import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Terra",
  description: "From farm to cup",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <>
      {/* <KBar> */}
      <SidebarProvider defaultOpen={defaultOpen}>
        {/* <AppSidebar /> */}
        <SidebarInset className="overflow-y-hidden">
          {/* <Header /> */}
          {/* page main content */}
          {children}
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
      {/* </KBar> */}
    </>
  );
}
