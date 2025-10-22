"use client";

import { Library, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Conversations",
    href: "/",
    icon: MessageSquare,
  },
  {
    title: "Library",
    href: "/library",
    icon: Library,
  },
  {
    title: "Moderation",
    href: "/moderation",
    icon: Shield,
  },
];

export function LeftRail() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-[var(--surface)]">
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
