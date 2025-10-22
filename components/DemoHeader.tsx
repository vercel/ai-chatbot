"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Video,
  MessageSquare,
  Database,
  Users,
  Zap,
  Settings,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/avatar", label: "Avatar", icon: Video, adminOnly: false },
  { href: "/chat", label: "Chat", icon: MessageSquare, adminOnly: false },
  { href: "/cms", label: "CMS", icon: Database, adminOnly: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/twins", label: "Twins", icon: Zap, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

type DemoHeaderProps = {
  isAdmin?: boolean;
  onToggleRole?: () => void;
};

export default function DemoHeader({
  isAdmin = true,
  onToggleRole,
}: DemoHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (!isAdmin) {
      // User mode: show twin landing page
      router.push("/twin/glen-tullman");
    } else {
      // Admin mode: go to main landing
      router.push("/");
    }
    setOpen(false);
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <header className="sticky top-0 z-30 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="font-semibold text-xl">Glen AI</div>

        <div className="flex items-center gap-2">
          {/* Role Toggle (for demo) */}
          {onToggleRole && (
            <Button
              onClick={onToggleRole}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {isAdmin ? "Admin" : "User"}
            </Button>
          )}

          {/* Hamburger Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col space-y-1">
                {visibleNavItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent font-medium text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
                <div className="my-4 border-t" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
