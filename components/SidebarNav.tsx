"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  Compass,
  Database,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/avatar", label: "Avatar", icon: Video },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/cms", label: "Knowledge", icon: Database },
  { href: "/discovery", label: "Discovery", icon: Compass },
  { href: "/users", label: "Users", icon: Users },
];

type NavContentProps = {
  currentPath: string;
  navLinkBase: string;
  onNavigate: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function NavContent({
  currentPath,
  navLinkBase,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: NavContentProps) {
  return (
    <>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "font-semibold text-xl tracking-tight",
              collapsed && "sr-only"
            )}
          >
            Glen AI
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            type="button"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <Separator className="my-4" />
        <div className="mt-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? currentPath === "/"
                : currentPath === href || currentPath.startsWith(`${href}/`);
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? label : undefined}
                className={cn(
                  navLinkBase,
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed ? "justify-center gap-0 px-0" : "",
                  isActive &&
                    !collapsed &&
                    "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                )}
                href={href}
                key={href}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
              >
                {collapsed ? (
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </span>
                ) : (
                  <>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span
                      className={cn(
                        "transition-all",
                        collapsed
                          ? "ml-0 w-0 overflow-hidden opacity-0"
                          : "ml-3 w-auto opacity-100"
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-border border-t p-5">
        <Link
          className={cn(
            navLinkBase,
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center gap-0" : ""
          )}
          href="/"
          onClick={onNavigate}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span
            className={cn(
              "ml-3 transition-all",
              collapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
            )}
          >
            Logout
          </span>
        </Link>
      </div>
    </>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    // Restore collapsed state from localStorage for persistence
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("sidebar:collapsed");
      setCollapsed(stored === "true");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "sidebar:collapsed",
        collapsed ? "true" : "false"
      );
    }
  }, [collapsed]);
  const navLinkBase = [
    "flex",
    "items-center",
    "gap-3",
    "rounded-lg",
    "px-3",
    "py-2",
    "text-sm",
    "transition-colors",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-ring",
  ].join(" ");

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        aria-label="Toggle navigation"
        className="fixed top-4 left-4 z-50 rounded-lg bg-background p-2 shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        type="button"
      >
        {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      {/* Desktop sidebar + Mobile drawer */}
      <nav
        aria-label="Primary"
        className={cn(
          "flex shrink-0 flex-col justify-between border-border border-r bg-sidebar",
          collapsed ? "w-16" : "w-60",
          "transition-all duration-300",
          "lg:relative lg:translate-x-0",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent
          collapsed={collapsed}
          currentPath={currentPath}
          navLinkBase={navLinkBase}
          onNavigate={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </nav>
    </>
  );
}
