"use client";

import {
  Compass,
  Database,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  User,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/avatar", label: "Avatar", icon: Video, adminOnly: false },
  { href: "/chat", label: "Chat", icon: MessageSquare, adminOnly: false },
  { href: "/cms", label: "Knowledge", icon: Database, adminOnly: true },
  { href: "/discovery", label: "Discovery", icon: Compass, adminOnly: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
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
    router.push("/");
    setOpen(false);
  };

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="font-semibold text-2xl">Glen AI</div>

        <div className="flex items-center gap-2">
          {/* Role Toggle (for demo) */}
          {onToggleRole && (
            <Button
              className="gap-2"
              onClick={onToggleRole}
              size="sm"
              variant="outline"
            >
              {isAdmin ? (
                <Shield className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {isAdmin ? "Admin" : "User"}
            </Button>
          )}

          {/* Hamburger Menu */}
          <Sheet onOpenChange={setOpen} open={open}>
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
                  const isActive =
                    pathname === href || pathname?.startsWith(`${href}/`);
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-accent font-medium text-accent-foreground"
                      )}
                      href={href}
                      key={href}
                      onClick={() => setOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
                <div className="my-4 border-t" />
                <button
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleLogout}
                  type="button"
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
