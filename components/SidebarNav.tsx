"use client";

import { Database, MessageSquare, Users, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/cms", label: "CMS", icon: Database },
  { href: "/users", label: "Users", icon: Users },
  { href: "/twins", label: "Twins", icon: Zap },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col justify-between border-border border-r bg-sidebar">
      <div className="p-5">
        <div className="font-semibold text-xl tracking-tight">Glen AI</div>
        <nav className="mt-8 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                )}
                href={href}
                key={href}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-border border-t p-5 text-muted-foreground text-xs">
        Prototype experience
      </div>
    </aside>
  );
}
