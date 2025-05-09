'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  UserCog,
  Users,
  Key,
  Cog,
  PanelLeft,
  ImageIcon,
  MessageSquare,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [openProviders, setOpenProviders] = useState(true);

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <NavItem
            href="/admin"
            icon={<PanelLeft className="h-4 w-4" />}
            label="Dashboard"
            active={pathname === '/admin'}
          />
          <Separator className="my-2" />

          <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
            User Management
          </p>
          <NavItem
            href="/admin/users"
            icon={<Users className="h-4 w-4" />}
            label="Users"
            active={pathname === '/admin/users'}
          />
          <NavItem
            href="/admin/roles"
            icon={<UserCog className="h-4 w-4" />}
            label="Role Management"
            active={pathname === '/admin/roles'}
          />

          <Separator className="my-2" />

          <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
            API & Models
          </p>

          <Collapsible
            open={openProviders}
            onOpenChange={setOpenProviders}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between px-2"
              >
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Providers</span>
                </div>
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-1">
              <NavItem
                href="/admin/providers/openai"
                icon={<Cog className="h-4 w-4" />}
                label="OpenAI"
                active={pathname === '/admin/providers/openai'}
              />
              <NavItem
                href="/admin/providers/xai"
                icon={<Cog className="h-4 w-4" />}
                label="xAI"
                active={pathname === '/admin/providers/xai'}
              />
              <NavItem
                href="/admin/providers/anthropic"
                icon={<Cog className="h-4 w-4" />}
                label="Anthropic"
                active={pathname === '/admin/providers/anthropic'}
              />
              <NavItem
                href="/admin/providers/google"
                icon={<Cog className="h-4 w-4" />}
                label="Google"
                active={pathname === '/admin/providers/google'}
              />
              <NavItem
                href="/admin/providers/add"
                icon={<Key className="h-4 w-4" />}
                label="Add Provider"
                active={pathname === '/admin/providers/add'}
              />
            </CollapsibleContent>
          </Collapsible>

          <NavItem
            href="/admin/models"
            icon={<MessageSquare className="h-4 w-4" />}
            label="Chat Models"
            active={pathname.startsWith('/admin/models')}
          />

          <NavItem
            href="/admin/image-models"
            icon={<ImageIcon className="h-4 w-4" />}
            label="Image Models"
            active={pathname === '/admin/image-models'}
          />

          <Separator className="my-2" />

          <NavItem
            href="/admin/settings"
            icon={<Cog className="h-4 w-4" />}
            label="Global Settings"
            active={pathname === '/admin/settings'}
          />
        </nav>
      </div>
    </div>
  );
}
