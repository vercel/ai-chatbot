import type { ReactNode } from "react";
import RouteTransition from "@/components/RouteTransition";
import SidebarNav from "@/components/SidebarNav";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-6">
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
