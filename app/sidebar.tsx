import { Plus } from "lucide-react";
import Link from "next/link";
import { Login } from "@/components/ui/login";
import { UserMenu } from "@/components/ui/user-menu";
import { prisma } from "@/lib/prisma";
import { VercelLogo } from "@/components/ui/vercel-logo";
import { SidebarItem } from "./sidebar-item";
import { cn } from "@/lib/utils";
import { type Session } from "next-auth";

export interface SidebarProps {
  session: Session | null;
  newChat?: boolean;
}

export function Sidebar({ session, newChat }: SidebarProps) {
  return (
    <div className="hidden shrink-0 bg-zinc-200/80 dark:bg-black md:flex md:w-[260px] md:flex-col">
      <div className="flex h-full min-h-0 flex-col ">
        <div className="scrollbar-trigger relative h-full w-full flex-1 items-start">
          <aside className="flex h-full w-full flex-col p-2 shadow-lg ring-1 ring-zinc-900/10 dark:ring-zinc-200/10 relative z-10">
            <div className="flex flex-row gap-1 items-center justify-between text-base font-semibold tracking-tight antialiased bg-black text-white px-4 py-4 -m-2 mb-2">
              <div className="flex flex-row gap-1 whitespace-nowrap items-center">
                <VercelLogo className="h-3.5" />
                <span className="select-none">Vercel Chat</span>
              </div>
              <div>
                {session?.user ? <UserMenu session={session} /> : <Login />}
              </div>
            </div>
            <Link
              href="/"
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded p-2 text-sm text-zinc-800 dark:text-zinc-200 font-medium transition-colors duration-300 dark:hover:bg-zinc-300/20 select-none",
                newChat
                  ? "bg-zinc-500/20 text-zinc-900 font-semibold hover:bg-zinc-500/30 dark:text-white"
                  : "hover:bg-zinc-500/10"
              )}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Link>

            <div className="mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-700 flex-1 flex-col overflow-y-auto overflow-x-hidden transition-opacity duration-500">
              <div className="flex flex-col pb-2 text-sm text-zinc-100">
                {/* @ts-ignore */}
                <SidebarList session={session} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

Sidebar.displayName = "Sidebar";

async function SidebarList({ session }: { session?: Session }) {
  const chats = await prisma.chat.findMany({
    where: {
      // This is for debugging, need to add scope to the query later
      // userId: session?.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  return chats.map((c) => (
    <SidebarItem key={c.id} title={c.title} href={`/chat/${c.id}`} id={c.id} />
  ));
}
